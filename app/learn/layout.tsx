import { ReactNode } from "react";
import '../user_globals.scss';

export default function AdminLayout({ children }: { children: ReactNode}) {
    return (
       <>{children}</>
    );
}