import { api, cookies } from "@/api/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useModal } from "@/hooks/use-modal-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

interface VerifyOtpForm {
  email: string;
  otp: string;
}

const formSchema = z.object({
  otp: z.string().min(6).max(6),
});

const useVerifyOtp = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: (data: VerifyOtpForm) => api.post("/verify_otp/", data),
  });

  return { mutate, isPending };
};

export const VerifyEmailModal = () => {
  const { isOpen, type, onClose, data } = useModal();

  const isModalOpen = isOpen && type === "emailVerify";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  const { mutate, isPending } = useVerifyOtp();

  const navigate = useNavigate();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(
      {
        email: data?.userdata?.email as string,
        otp: values?.otp,
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSuccess: (data: any) => {
          const token = data?.data?.data?.access;
          cookies.set("app_token", token);
          const userName = data?.data?.data?.name;
          cookies.set("user_name", userName);
          navigate("/home");
        },
        onError: () => {
          toast.error("Invalid OTP");
        },
      }
    );
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="flex justify-center items-center max-w-[300px]">
        <DialogHeader>
          <DialogTitle className="mb-4">Please verify your email</DialogTitle>
          <DialogDescription></DialogDescription>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <InputOTP
                        className="w-full"
                        autoFocus
                        maxLength={6}
                        disabled={isPending}
                        {...field}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                  </FormItem>
                )}
              />
              <div>
                <Button className="w-full mt-4 bg-blue-400 hover:bg-blue-400/90">
                  Submit
                </Button>
              </div>
            </form>
          </Form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
