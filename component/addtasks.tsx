"use client";
import { title } from "process";
import { useState } from "react";

export default function AddTasks() {
    const [task, setTask] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        priority: "Medium",
        type: "work",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTask((prev) => ({ ...prev, [name]: value }));
    };

    const handleAdd = () => {
        if (!task.title.trim()) {
            alert("Please enter a task title!");
            return;
        }

        const storedTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
        const updatedTasks = [...storedTasks, { id: Date.now(), ...task }];
        localStorage.setItem("tasks", JSON.stringify(updatedTasks));

        alert("Task added!");
        setTask({
            title: "",
            description: "",
            date: "",
            time: "",
            priority: "Medium",
            type: "work",
        });
    };

    return (
        <div className="bg-sky-100 dark:bg-gray-900 sm:w-[700px] sm:flex items-center flex-col
         rounded-2xl w-full max-w-full sm:h-[700px] ">
            <h1 className="text-center p-3 font-bold text-3xl font-serif mt-3 text-shadow-sm text-shadow-violet-500" >Add Tasks</h1>
            <form
                className="sm:rounded-xl sm:flex sm:items-center sm:flex-col sm:border-2 border-amber-300 
                sm:m-1 bg-sky-50 sm:w-[590px] w-full sm:gap-7 sm:shadow-lg shadow-stone-500 
                 w-fit flex flex-wrap m-1 justify-center items-center flex-col">
                <div className=" sm:flex sm:justify-around sm:flex-row sm:w-full sm:gap-1 sm:mt-3 
                                 flex flex-wrap flex-col justify-center items-center w-full gap-2 mt-2 border-0 border-amber-950">
                    <span className="sm:text-xl font-serif sm:border-0 border-amber-300 w-full sm:w-[200px] sm:text-center">Tasks Title :</span>
                    <input
                        type="text"
                        placeholder="title"
                        name="title"
                        value={task.title}
                        onChange={handleChange}
                        className=" font-[20px] font-serif sm:w-[300px] w-full border-2 border-gray-400 rounded-sm text-xl p-1 mr-2">
                    </input>
                </div>
                <div className="border-0 w-full border-gray-950 sm:flex sm:justify-around sm:flex-row sm:w-full sm:gap-1 
                flex flex-wrap justify-center items-center">
                    <span className="text-xl font-serif border-0 border-amber-300 sm:w-[300px] w-full text-center ">Description :</span>
                    <textarea
                        name="description"
                        value={task.description}
                        onChange={handleChange}
                        placeholder="Tasks Detail"
                        className=" font-[20px] font-serif sm:w-[310px] w-full border-2
                     border-gray-400 rounded-sm text-xl p-1 mr-2 flex flex-wrap">
                    </textarea>
                </div>
                <div className="sm:flex font-serif text-sm sm:p-0 p-3 sm:text-md gap-2">
                    <span>Types :</span>
                    <select
                        name="type"
                        value={task.type}
                        onChange={handleChange}
                        id="seclectype"
                        className="bg-amber-200 sm:p-2 p-1.5  rounded-md border-2 border-gray-500">
                        <option value="work" className="bg-white">Work</option>
                        <option value="study" className="bg-white">Study</option>
                        <option value="activities" className="bg-white">Activities</option>
                    </select>
                    <span>Priority :</span>
                    <select
                        name="priority"
                        value={task.priority}
                        onChange={handleChange}
                        id="priority"
                        className="bg-cyan-200 sm:p-2 p-1.5 rounded-md border-2 border-gray-500 ">
                        <option className="bg-red-400">High</option>
                        <option className="bg-orange-400">Medium</option>
                        <option className="bg-green-400">Low</option>
                    </select>
                </div>
                <div className="sm:flex">
                    <div>
                        <span>Date</span>
                        <input
                            value={task.date}
                            onChange={handleChange}
                            type="date"
                            name="date"
                            className=" block w-full rounded-lg border-2 border-gray-500 sm:p-3 p-1.5 font-sans"></input>
                    </div>
                    <div>
                        <span>Time</span>
                        <input
                            value={task.time}
                            type="time"
                            name="time"
                            onChange={handleChange}
                            className=" block w-full rounded-lg border-2 border-gray-500 sm:p-3 p-1.5 font-sans"></input>
                    </div>
                </div>
                <div className="sm:flex mt-7 sm:gap-45 sm:font-serif sm:mt-[20px] sm:mb-[70px] flex gap-10 justify-center">
                    <button type="button" className="px-7 py-2 rounded-lg bg-slate-400 text-white font-semibold hover:bg-slate-500">chancel</button>
                    <button type="button" onClick={handleAdd} className="px-11 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">save</button>
                </div>
            </form >
        </div >
    )
};