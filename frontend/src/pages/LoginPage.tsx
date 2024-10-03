import { api, cookies } from "@/api/config";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import toast from "react-hot-toast";
import { useModal } from "@/hooks/use-modal-store";
import { VerifyEmailModal } from "@/components/modals/VerifyEmailModal";

interface LoginForm {
  email: string;
  password: string;
}

interface SendOtpForm {
  email: string;
}

const useLogin = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: (data: LoginForm) => api.post("/login/", data),
  });

  return { mutate, isPending };
};

const useSendOtp = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: (data: SendOtpForm) => api.post("/resend_otp/", data),
  });

  return { mutate, isPending };
};

const formSchema = z.object({
  email: z
    .string()
    .min(2, { message: "Email must be at least 2 characters long" })
    .max(50, { message: "Email must be at most 50 characters long" })
    .email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(50, { message: "Password must be at most 50 characters long" }),
});

export const LoginPage = () => {
  const { mutate, isPending } = useLogin();
  const { mutate: sendOtp } = useSendOtp();

  const { onOpen } = useModal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const navigate = useNavigate();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSuccess: (data: any) => {
        const token = data?.data?.data?.access;
        cookies.set("app_token", token);
        const userName = data?.data?.data?.name;
        cookies.set("user_name", userName);
        toast.success("Welcome to app!");
        navigate("/home");
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        const statusCode = error?.status;
        const errorMessage = error?.response?.data?.message;

        if (statusCode === 403) {
          onOpen("emailVerify", {
            userdata: {
              email: values?.email,
            },
          });
          toast.error("Please verify your email!");
          sendOtp({
            email: values?.email,
          });
        } else {
          if (errorMessage) {
            toast.error(errorMessage);
          }
        }

        const finalError = error?.response?.data;

        const { email } = finalError;
        const emailError = email?.[0];

        const setError = (field: "email", message: string) => {
          if (message) {
            form.setError(field, { message });
          }
        };

        setError("email", emailError);
      },
    });
  };
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Login to your account
        </h2>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        placeholder="Enter email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        type="password"
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        placeholder="Enter password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <Button
                disabled={isPending}
                className="bg-blue-400 hover:bg-blue-400/90 w-full"
              >
                Login
              </Button>
            </div>
          </form>
        </Form>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-blue-400 hover:text-blue-500"
          >
            Register
          </Link>
        </p>
      </div>
      <VerifyEmailModal />
    </div>
  );
};
