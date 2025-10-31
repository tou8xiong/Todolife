import { BsLayoutSidebarInset } from "react-icons/bs";

export default function Sidebar() {
    return (
        <aside className="  text-white hidden md:block fixed left-0 top-0 h-screen w-45 bg-gray-800 z-40 
         mt-[80px] border-r-1 border-amber-400 ">
            <div className="flex justify-center flex-col my-3 gap-0.5">
                <div className=" flex justify-center border-0 border-rose-500 "><BsLayoutSidebarInset size={30} className="m-3" color="red"/></div>
                <button className="flex  border-0 border-amber-600">
                    <a className="bg-gray-500 rounded-sm w-full hover:bg-gray-600 py-1" href="/settimepage">settimer</a>
                </button>
                <button className="flex  border-0 border-amber-600">
                    <a className="bg-gray-500 rounded-sm w-full hover:bg-gray-600 py-1" href="/noteidea">IdeaNote</a>
                </button>
            </div>
        </aside>
    );
}
