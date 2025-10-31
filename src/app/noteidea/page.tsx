"use client"
import { GiNotebook } from "react-icons/gi";
import { FaPenClip } from "react-icons/fa6";
import { useState } from "react";


export default function NooteBook(){
    const [idea, setIdea] = useState({
        idea:""
    });

     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setIdea((prev) => ({ ...prev, [name]: value }));
    };
    const handleaddIdea = () =>{
        const storeIdea = JSON.parse(localStorage.getItem("Ideas") || "[]");
        const updatedIdea = [...storeIdea, { id: Date.now(), ...idea }];
        localStorage.setItem("Ideas", JSON.stringify(updatedIdea));

        setIdea({
            idea:""
        })
        console.log("this is store idea", storeIdea)
    }


    return(
        <div className="  ml-45 mt-0 font-serif">
            <div className=" flex justify-center flex-col items-center p-2">
                <h1 className="text-xl font-bold font-serif "> <GiNotebook size={55} color="gray"/></h1>
                <div className="mt-20">
                    <h1 className="flex ">Keep your Idea here  <FaPenClip size={27} color="red" className="m-2"/></h1>
                    <input type="text" name="idea" onChange={handleChange} value={idea.idea}  className="text-lg border-1 border-gray-500 px-2 py-2 w-[400px] rounded"></input>
                    <button onClick={handleaddIdea}>Keep</button>
                </div>
            </div>
        </div>
    )
}