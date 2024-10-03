import { api, cookies } from "@/api/config";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

interface UserContact {
  name: string;
  phone_number: string;
}
interface UserAddContact {
  name: string;
  phone_number: string;
}

const useUserContact = () => {
  const { data, isLoading } = useQuery({
    queryFn: () => api.get("/user_contact/"),
    queryKey: ["userContact"],
  });

  const finalData = data?.data as UserContact[];

  return { finalData, isLoading };
};

const useAddContact = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UserAddContact) => api.post("/user_contact/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userContact"],
      });
    },
  });

  return { mutate, isPending };
};

export const HomePage = () => {
  const { finalData } = useUserContact();

  const { onOpen } = useModal();

  return (
    <div>
      <div>
        <hr className="my-4" />
        <div className="flex justify-between items-center my-4">
          <div className="flex justify-start items-center gap-x-2">
            <div className="bg-blue-400 text-white h-10 w-10 rounded-full flex justify-center items-center font-semibold">
              U
            </div>

            <div>
              <p className="text-[16px] capitalize">
                {cookies.get("user_name")}
              </p>
              <p className="text-[12px] text-black/60">My Card</p>
            </div>
          </div>
          <div>
            <Button
              onClick={() => onOpen("addContact")}
              className="bg-transparent hover:bg-transparent border-none shadow-none text-black"
            >
              <Plus />
            </Button>
          </div>
        </div>

        <hr />

        <div className="flex flex-col gap-y-4 mt-8 h-[400px] overflow-y-scroll">
          {finalData &&
            finalData?.map((user, index) => (
              <div
                key={index}
                className="bg-zinc-300/50 p-2 rounded-md drop-shadow-sm font-semibold"
              >
                <p>{user?.name}</p>
                <p className="text-sm text-black/50">{user?.phone_number}</p>
              </div>
            ))}
        </div>
      </div>
      <AddContactModal />
    </div>
  );
};

const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name must be at most 50 characters long" }),
  phone_number: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits long" })
    .max(15, { message: "Phone number must be at most 15 digits long" })
    .regex(/^\d{10,15}$/, {
      message:
        "Phone number must contain only digits and length should be 10 or 15",
    }),
});

const AddContactModal = () => {
  const { isOpen, onClose, type } = useModal();

  const isModalOpen = isOpen && type === "addContact";

  const { mutate, isPending } = useAddContact();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone_number: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
      onError: () => {
        toast.error("This number is already added!");
      },
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[350px] ">
        <p>Add Contact</p>
        <hr />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        {...field}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        placeholder="Enter name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        {...field}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        placeholder="Enter phone number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                disabled={isPending}
                className="w-full bg-blue-400 hover:bg-blue-400/90"
              >
                Add
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
