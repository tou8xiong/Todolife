"use client"
import { GiNotebook } from "react-icons/gi";
import { FaPenClip } from "react-icons/fa6";
import { useState,useEffect } from "react";
import { MdDelete } from "react-icons/md";

interface Idea {
    id:number;
    ideatext:string;
}

export default function NooteBook(){
    const [curentideas, setCurentIdeas] = useState({
        ideatext:""
    });
    const [ideas, setIdeas] = useState<Idea[]>([]);


    useEffect(() =>{
        const storeIdeas = JSON.parse(localStorage.getItem("Ideas") || "[]");
        setIdeas(storeIdeas);
    }, []);


     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurentIdeas((prev) => ({ ...prev, [name]: value }));
    };
    const handleaddIdea = () =>{
        if (!curentideas.ideatext.trim()) return;

        const newIdea = {id: Date.now(), ...curentideas};
        const updatedIdeas = [... ideas,newIdea];
        localStorage.setItem("Ideas" , JSON.stringify(updatedIdeas));
        setIdeas(updatedIdeas);
        setCurentIdeas({ ideatext:""});
    }
    const handleDelete = (id:number) => {
        const storeIdeas : Idea[] = JSON.parse(localStorage.getItem("Ideas") || "[]");
        const updatedIdeas = storeIdeas.filter((idea) => idea.id !== id);
        localStorage.setItem("Ideas" , JSON.stringify(updatedIdeas));
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("updatedIdeas"));
        }
        setIdeas(updatedIdeas);
    }


    return(
        <div className="sm:ml-45 mt-0 font-serif">
            <div className=" flex justify-center flex-col items-center p-2 border-0 border-amber-600">
                <h1 className="text-xl font-bold font-serif "> <GiNotebook size={55} color="#3cbffc"/></h1>
                <div className="mt-10 flex justify-center sm:w-full w-full flex-col items-center border-0 border-amber-500">
                    <h1 className="flex ">Keep your Idea here  <FaPenClip size={20} color="red" className="m-2"/></h1>
                    <div className="flex flex-col sm:w-auto w-full">
                    <input placeholder="........" type="text" name="ideatext" onChange={handleChange} value={curentideas.ideatext}  
                    className="sm:text-lg border-1 border-sky-500 px-2 py-2 sm:w-[750px] w-full rounded"></input>
                    <button onClick={handleaddIdea} 
                    className="ml-auto border-1 cursor-pointer border-gray-300
                     bg-gradient-to-b from-sky-300 to-green-300 px-6 rounded hover:text-white py-1 mt-1">Keep</button></div>
                </div>
                <div className="border-0 border-amber-400 w-full h-fit flex justify-center flex-col items-center mt-4">
                    <label className="bg-blue-400 sm:w-[750px] w-full text-center text-lg rounded py-3">Your Idea</label>
                <ul className="border-0 border-gray-300 sm:w-[750px] sm:h-[650px] w-full h-[450px] overflow-y-auto hide-scrollbar gap-1 flex flex-col shadow-md shadow-black">
                    {ideas.map((idea,index) => (
                        <li key={idea.id} className="border-b-2 py-2 border-gray-400 break-words"><span>{index + 1}.</span><span className="ml-5">{idea.ideatext}</span> 
                        <button onClick={() => handleDelete(idea.id)} 
                        className="p-1 float-end px-1 rounded"><MdDelete 
                        color="red" className="cursor-pointer" size={25}/></button></li>
                    ))}
                </ul>
                </div>
            </div>
        </div>
    )
}