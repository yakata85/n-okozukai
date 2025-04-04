import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./calendar-dark-theme.css";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "firebase/firestore";

export default function App() {
  const [view, setView] = useState("home");
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ name: "", date: "", item: "", amount: "", id: null });
  const [authorized, setAuthorized] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const ACCESS_KEY = "1415";

  const [selectedName, setSelectedName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());

  const recordsCollection = collection(db, "records");

  useEffect(() => {
    const unsubscribe = onSnapshot(recordsCollection, (snapshot) => {
      const result = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setRecords(result);
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().split("T")[0];
  };

  const recordsOnSelectedDate = records.filter(r => r.date === formatDate(calendarDate));

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.id) {
      const ref = doc(db, "records", form.id);
      await updateDoc(ref, form);
    } else {
      await addDoc(recordsCollection, form);
    }
    setForm({ name: "", date: "", item: "", amount: "", id: null });
    setView("home");
  };

  const handleEdit = (record) => {
    setForm(record);
    setView("add");
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "records", id));
  };

  const nameOptions = ["ママ", "パパ", "はやと", "いちか"];

  const filteredRecords = records.filter((r) => {
    return (
      (selectedName ? r.name === selectedName : true) &&
      (selectedMonth ? r.date.startsWith(selectedMonth) : true)
    );
  });

  const groupedByMonthAndName = {};
  filteredRecords.forEach(r => {
    const month = r.date.slice(0, 7);
    if (!groupedByMonthAndName[month]) {
      groupedByMonthAndName[month] = {};
    }
    groupedByMonthAndName[month][r.name] = (groupedByMonthAndName[month][r.name] || 0) + Number(r.amount);
  });

  const stackedChartData = Object.entries(groupedByMonthAndName).map(([month, data]) => ({
    name: month,
    ...data
  }));

  const getTotalByName = () => {
    const result = {};
    filteredRecords.forEach(r => {
      result[r.name] = (result[r.name] || 0) + Number(r.amount);
    });
    return result;
  };

  const totalByName = getTotalByName();
  const chartDataByName = Object.entries(totalByName).map(([name, total]) => ({ name, total }));

  const colorMap = {
    ママ: "#FF6384",
    パパ: "#36A2EB",
    はやと: "#FFCE56",
    いちか: "#4BC0C0",
  };

  if (!authorized) {
    return (
      <div className="p-4 max-w-sm mx-auto text-center bg-black text-white min-h-screen">
        <h2 className="text-lg font-bold mb-4">永田家専用アクセスキー</h2>
        <input
          type="password"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          className="border p-3 rounded w-full text-black"
        />
        <button
          onClick={() => {
            if (inputKey === ACCESS_KEY) {
              setAuthorized(true);
            } else {
              alert("アクセスキーが違います");
            }
          }}
          className="mt-4 bg-yellow-400 text-black py-2 px-4 rounded text-lg"
        >送信</button>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen max-w-md mx-auto p-4 text-base">
      <header className="flex items-center justify-center mb-6">
        <img src="/gorilla-icon.png" alt="ゴリラアイコン" className="w-10 h-10 mr-2" />
        <h1 className="text-2xl font-bold text-center">永田家小遣い帳</h1>
      </header>

      {view === "home" && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setView("add")} className="bg-yellow-400 text-black py-3 rounded-xl text-lg">支出を記録</button>
          <button onClick={() => setView("list")} className="bg-gray-700 text-white py-3 rounded-xl text-lg">支出を見る</button>
          <button onClick={() => setView("calendar")} className="bg-purple-600 text-white py-3 rounded-xl text-lg">カレンダー表示</button>
        </div>
      )}

      {view === "add" && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
          <select name="name" value={form.name} onChange={handleChange} required className="border p-3 rounded text-black">
            <option value="">名前を選択</option>
            {nameOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <input name="date" value={form.date} onChange={handleChange} required type="date" className="border p-3 rounded text-black" />
          <input name="item" value={form.item} onChange={handleChange} required placeholder="使った内容" className="border p-3 rounded text-black" />
          <input name="amount" value={form.amount} onChange={handleChange} required type="number" placeholder="金額" className="border p-3 rounded text-black" />
          <button type="submit" className="bg-green-500 text-white py-3 rounded-xl text-lg">保存</button>
          <button onClick={() => setView("home")} type="button" className="text-sm text-gray-400 mt-2">戻る</button>
        </form>
      )}

      {view === "calendar" && (
        <div className="mt-6">
          <button onClick={() => setView("home")} className="text-sm text-gray-400 mb-4">戻る</button>
          <h2 className="font-bold mb-2 text-lg">日別の支出</h2>
          <Calendar value={calendarDate} onChange={setCalendarDate} locale="ja-JP" className="mb-4 rounded-lg overflow-hidden" />
          {recordsOnSelectedDate.length === 0 ? (
            <p>この日に記録はありません。</p>
          ) : (
            <ul className="space-y-3">
              {recordsOnSelectedDate.map((r) => (
                <li key={r.id} className="border border-gray-700 p-3 rounded-xl">
                  <div><strong>{r.name}</strong>：{r.item}</div>
                  <div>{r.date} / {Number(r.amount).toLocaleString()}円</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {view === "list" && (
        <div className="mt-6">
          <button onClick={() => setView("home")} className="text-sm text-gray-400 mb-4">戻る</button>

          <div className="mb-6">
            <h2 className="font-bold mb-3 text-lg">フィルター</h2>
            <div className="flex gap-3 mb-4">
              <select value={selectedName} onChange={(e) => setSelectedName(e.target.value)} className="border p-3 rounded w-1/2 text-black">
                <option value="">全員</option>
                {nameOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border p-3 rounded w-1/2 text-black" />
            </div>

            <h2 className="font-bold mb-2">人別 合計</h2>
            <ul className="mb-4">
              {Object.entries(totalByName).map(([name, total]) => (
                <li key={name}>{name}：{total.toLocaleString()}円</li>
              ))}
            </ul>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartDataByName}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Bar dataKey="total" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>

            <h2 className="font-bold mt-6 mb-2">月別（人別）合計</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stackedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Legend />
                {nameOptions.map(name => (
                  <Bar key={name} dataKey={name} stackId="a" fill={colorMap[name]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {filteredRecords.length === 0 ? (
            <p>記録がありません。</p>
          ) : (
            <ul className="space-y-3">
              {filteredRecords.map((r) => (
                <li key={r.id} className="border border-gray-700 p-3 rounded-xl">
                  <div><strong>{r.name}</strong>：{r.item}</div>
                  <div>{r.date} / {Number(r.amount).toLocaleString()}円</div>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => handleEdit(r)} className="text-blue-400 text-sm">編集</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-400 text-sm">削除</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
