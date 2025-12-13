import Image from 'next/image';
import FooterImage from "../public/Webicon.png";
import { FaSquarePhone } from "react-icons/fa6";
import { MdOutlineEmail } from "react-icons/md";


export default function Footer() {
    return (
        <div
            className="bg-gray-900 text-white font-serif flex justify-center items-center flex-col bg-linear-to-b
                 from-gray-900 to-gray-700 px-4 sm:px-8 py-30" id="footer">
            <div className=" flex flex-col sm:flex-row gap-8 sm:gap-16 justify-between w-full max-w-4xl border-0 border-amber-600">
                <div className="bg-white p-2 rounded-md">
                    <Image src={FooterImage} alt='transparentImage' className='w-[100px] h-full' />
                </div>
                <div>
                    <h1 className='text-bold text-center text-2xl'>Quick Links</h1>
                    <ul className='mt-3'>
                        <li><a href='/' className='text-blue-500 hover:text-blue-600 hover:underline underline-offset-2'>Home</a></li>
                        <li><a href='/newtasks' className='text-blue-500 hover:text-blue-600 hover:underline underline-offset-2'>Newtasks</a></li>
                        <li><a href='/mytasks' className='text-blue-500 hover:text-blue-600 hover:underline underline-offset-2'>Mytasks</a></li>
                        <li><a href='/completetasks' className='text-blue-500 hover:text-blue-600 hover:underline underline-offset-2'>Completetasks</a></li>
                        <li><a href='/noteidea' className='text-blue-500 hover:text-blue-600 hover:underline underline-offset-2'>Noteidea</a></li>
                        <li><a href='/setimepage' className='text-blue-500 hover:text-blue-600 hover:underline underline-offset-2'>Settimer</a></li>
                    </ul>
                </div>
                <div className="">
                    <h1 className="text-xl sm:text-2xl text-center sm:text-left mb-3 sm:mb-5">Contact Us</h1>
                    <h1 className='flex'><FaSquarePhone size={35} color='green' className='mr-3' /> 78292260</h1>
                    <h1 className='flex'><MdOutlineEmail size={35} color='gold' className='mr-3' /> touxhk@gmail.com</h1>
                </div>
            </div>
            <div className='mt-49'>
                <p>@Vietiane Laos BY TouXY 2025</p>
            </div>
        </div>
    )
}