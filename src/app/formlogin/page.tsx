import { FcGoogle } from "react-icons/fc";

export default function FormLogIN() {
    return (
        <div className="flex justify-center">
            <div className="sm:ml-45 font-serif text-xl  h-full w-full flex justify-center border-0 border-amber-950">
                <form id="form" className=" mt-2 sm:w-[450px] sm:h-[600px] w-[600px] border-1 border-amber-400 sm:rounded-md 
                rounded-md sm:shadow-lg shadow-md shadow-gray-900">
                    <h1 className="text-center font-bold sm:text-3xl">LOG IN</h1>
                    <div className="sm:m-10 m-3 flex justify-center flex-col border-0 border-amber-700 sm:p-0 p-5">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="email" className="sm:p-1.5 p-1 border-1 border-gray-400 " required/><br />
                        <label>Password</label>
                        <input type="password" name="password" placeholder="password" className="sm:p-1.5 p-1 border-1 border-gray-400" required/>
                        <br />
                        <button className="bg-sky-500 sm:p-3 p-2 rounded-md hover:bg-sky-600 cursor-pointer" type="submit">Log in</button>
                        <br />
                        <br />
                        <hr />
                        <br />
                        <div className="w-full">
                            <button className="p-0 border-0 w-full cursor-pointer bg-sky-300 flex text-center items-center hover:bg-sky-400" >
                                <FcGoogle className="bg-white m-0.5 mr-10" size={50} />log in with google</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}