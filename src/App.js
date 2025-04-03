import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function App() {
  const [view, setView] = useState("home");
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem("records");
    return saved ? JSON.parse(saved) : [];
  });
  const [form, setForm] = useState({ name: "", date: "", item: "", amount: "", id: null });
  const [authorized, setAuthorized] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const ACCESS_KEY = "1415";

  if (!authorized) {
    return (
      <div className="p-4 max-w-sm mx-auto text-center">
        <h2 className="text-lg font-bold mb-2">永田家専用アクセスキー</h2>
        <input
          type="password"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={() => {
            if (inputKey === ACCESS_KEY) {
              setAuthorized(true);
            } else {
              alert("アクセスキーが違います");
            }
          }}
          className="mt-2 bg-blue-500 text-white py-1 px-3 rounded"
        >
          送信
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updated;
    if (form.id) {
      updated = records.map(r => r.id === form.id ? form : r);
    } else {
      const newRecord = { ...form, id: Date.now() };
      updated = [newRecord, ...records];
    }
    setRecords(updated);
    localStorage.setItem("records", JSON.stringify(updated));
    setForm({ name: "", date: "", item: "", amount: "", id: null });
    setView("home");
  };

  const handleEdit = (record) => {
    setForm(record);
    setView("add");
  };

  const handleDelete = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem("records", JSON.stringify(updated));
  };

  const getTotalByName = () => {
    const result = {};
    records.forEach(r => {
      result[r.name] = (result[r.name] || 0) + Number(r.amount);
    });
    return result;
  };

  const getTotalByMonth = () => {
    const result = {};
    records.forEach(r => {
      const month = r.date.slice(0, 7);
      result[month] = (result[month] || 0) + Number(r.amount);
    });
    return result;
  };

  const totalByName = getTotalByName();
  const totalByMonth = getTotalByMonth();
  const nameOptions = ["ママ", "パパ", "はやと", "いちか"];

  const chartDataByName = Object.entries(totalByName).map(([name, total]) => ({ name, total }));
  const chartDataByMonth = Object.entries(totalByMonth).map(([month, total]) => ({ name: month, total }));

  return (
    <div className="max-w-md mx-auto p-4 text-sm">
      <h1 className="text-xl font-bold mb-4 text-center">永田家小遣い帳</h1>

      {view === "home" && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setView("add")} className="bg-blue-500 text-white py-2 rounded">支出を記録</button>
          <button onClick={() => setView("list")} className="bg-gray-500 text-white py-2 rounded">支出を見る</button>
        </div>
      )}

      {view === "add" && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4">
          <select name="name" value={form.name} onChange={handleChange} required className="border p-2 rounded">
            <option value="">名前を選択</option>
            {nameOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <input name="date" value={form.date} onChange={handleChange} required type="date" className="border p-2 rounded" />
          <input name="item" value={form.item} onChange={handleChange} required placeholder="使った内容" className="border p-2 rounded" />
          <input name="amount" value={form.amount} onChange={handleChange} required type="number" placeholder="金額" className="border p-2 rounded" />
          <button type="submit" className="bg-green-500 text-white py-2 rounded">保存</button>
          <button onClick={() => setView("home")} type="button" className="text-sm text-gray-600 mt-2">戻る</button>
        </form>
      )}

      {view === "list" && (
        <div className="mt-4">
          <button onClick={() => setView("home")} className="text-sm text-gray-600 mb-2">戻る</button>

          <div className="mb-4">
            <h2 className="font-bold mb-1">人別 合計</h2>
            <ul>
              {Object.entries(totalByName).map(([name, total]) => (
                <li key={name}>{name}：{total.toLocaleString()}円</li>
              ))}
            </ul>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartDataByName}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>

            <h2 className="font-bold mt-3 mb-1">月別 合計</h2>
            <ul>
              {Object.entries(totalByMonth).map(([month, total]) => (
                <li key={month}>{month}：{total.toLocaleString()}円</li>
              ))}
            </ul>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartDataByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {records.length === 0 ? (
            <p>記録がありません。</p>
          ) : (
            <ul className="space-y-2">
              {records.map((r) => (
                <li key={r.id} className="border p-2 rounded">
                  <div><strong>{r.name}</strong>：{r.item}</div>
                  <div>{r.date} / {Number(r.amount).toLocaleString()}円</div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => handleEdit(r)} className="text-blue-500 text-xs">編集</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-500 text-xs">削除</button>
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
