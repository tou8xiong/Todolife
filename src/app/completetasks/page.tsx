
import DoneTasks from "../../../component/donetasks";

export default function Completetasks(){
    return(
        <div 
        className="flex sm:w-full sm:h-fit w-full min-h-screen border-0 border-amber-300 font-serif text-base
         sm:text-lg px-3 sm:px-0 py-0 sm:flex sm:justify-center hide-scrollbar">
            <DoneTasks />
        </div>
    )
}