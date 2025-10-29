import { FcGoogle } from "react-icons/fc";


export default function FormSignUp() {
    return (
        <div className=" font-serif text-xl flex justify-center items-center">
            <div className="sm:ml-60 border-1 border-gray-400 sm:w-[450px] sm:h-[570px] mt-7 bg-cyan-50 rounded-lg shadow-xl">
                <form className="flex justify-center flex-col items-center"
                    id="form">
                    <h1 className="font-bold sm:text-3xl">Sign up</h1>
                    <div className="flex flex-col w-full sm:p-10 p-10 sm:text-lg ">
                        <label>First Name</label>
                        <input type="text" name="lastname" className="border-1 border-gray-400 p-1.5 rounded-sm bg-white" placeholder="first name" required />
                        <label>Last Name</label>
                        <input placeholder="last name " name="lastname" className="border-1 border-gray-400 p-1.5 rounded-sm bg-white" required />
                       
                        <label>Email</label>
                        <input placeholder="email" name="email" className="border-1 border-gray-400 p-1.5 rounded-sm bg-white" required />
                      
                        <label>Last Name</label>
                        <input placeholder="password " name="password" className="border-1 border-gray-400 p-1.5 rounded-sm bg-white" required />
                        <br />
                        <button className="bg-sky-400 hover:bg-sky-500 p-2 rounded-sm " type="submit">submit</button>
                        <br />
                        <div className="w-full">
                            <button className="p-0 border-0 w-full cursor-pointer bg-sky-300 flex text-center items-center hover:bg-sky-400">
                                <FcGoogle className="bg-white sm:m-0.5 m-0.5 sm:mr-10" size={50} />log in with google</button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    )

}