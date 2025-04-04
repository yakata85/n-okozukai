import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
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

      {/* 他の view 表示もこの下に同様に続きます（list, add, calendar） */}
    </div>
  );
}
