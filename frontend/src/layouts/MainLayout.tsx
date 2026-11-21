import { Outlet } from "react-router-dom";
import Header from "../components/Header";


export default function MainLayout(){
    
    return(
        <div className="min-h-screen bg-[#fbf9fa] text-[#1b1c1d] flex flex-col">
            <header className="w-full px-4 pt-4 md:px-8 md:pt-6">
                <Header />
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    )
}