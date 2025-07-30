'use client';

import Image from "next/image";
import headerLogo from '@/assets/images/logo.svg'
import Link from "next/link";
import { useState } from "react";
import hamburgerImage from '@/assets/images/hamburger.svg'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <>
      <header className="flex items-center justify-between w-[90%] m-auto">
        <div>
          <Image src={headerLogo} alt="header-logo" className='sm:w-[250px] w-[150px] bg-transparent' />
        </div>
        <button className="sm:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle Menu">
          <Image src={hamburgerImage} alt="hamburger" className="w-[30px]" />
        </button>
        <nav className={`sm:flex sm:gap-10 sm:items-center hidden ${isMenuOpen ? "flex" : "hidden"}`}>
          <Link href={"/"}>Home</Link>
          <Link href={"/courses"}>Courses</Link>
          <Link href={"/instructors"}>Instructors</Link>
          <Link href={"/testimonials"}>Testimonials</Link>
          <Link href={"/register"}>
            <button className="bg-[#e66d0b] outline-none text-white font-[500px] px-4 py-2 rounded-md hover:bg-[#f47c00] transition-all ease-in-out duration-300">Register</button>
          </Link>
          <Link href={"/login"}>
            <button className="bg-black text-white outline-none px-4 py-2 rounded-md hover:bg-neutral-100 hover:text-black transition-all ease-in-out duration-300">Login</button>
          </Link>
        </nav>
      </header>
    </>
  )
}