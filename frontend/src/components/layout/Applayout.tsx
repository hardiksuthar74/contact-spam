import { cookies } from "@/api/config";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Home, LogOutIcon, Search } from "lucide-react";

export const Applayout = () => {
  const token = cookies.get("app_token");

  const navigate = useNavigate();

  const LogoutHandler = () => {
    cookies.remove("app_token");
    return navigate("/login");
  };

  return token ? (
    <div className="min-h-screen bg-gray-100 max-w-[400px] mx-auto">
      <div className="fixed bottom-0 w-full bg-blue-400 h-16 mx-auto max-w-[400px] flex justify-between items-center px-4">
        <Button
          onClick={() => navigate("/search")}
          className="bg-transparent hover:bg-transparent shadow-none"
        >
          <Search />
        </Button>
        <Button
          onClick={() => navigate("/home")}
          className="bg-transparent hover:bg-transparent shadow-none"
        >
          <Home />
        </Button>
        <Button
          onClick={LogoutHandler}
          className="bg-transparent hover:bg-transparent shadow-none"
        >
          <LogOutIcon />
        </Button>
      </div>
      <div className="px-6 py-4 mb-16 overflow-y-hidden">
        <p className="text-black/50 text-[12px] font-semibold">Welcome,</p>
        <p className="text-3xl font-semibold capitalize">
          {cookies.get("user_name")}
        </p>
        <Outlet />
      </div>
    </div>
  ) : (
    <Navigate to="/login" />
  );
};
