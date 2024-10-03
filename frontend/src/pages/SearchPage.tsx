import { api } from "@/api/config";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useModal } from "@/hooks/use-modal-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CircleOff, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface UserSearchedContact {
  name: string;
  phone_number: string;
  spam_likelihood: number;
  email: string;
}

const useSearchNumber = (query: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["users", query],
    queryFn: () =>
      api.get("/search_contact/", {
        params: {
          query,
        },
      }),
  });

  const finalData = data?.data as UserSearchedContact[];

  return { finalData, isLoading };
};

export const SearchPage = () => {
  const { onOpen } = useModal();
  const [query, setQuery] = useState("");

  const debouncedQuery = useDebounce(query, 500);

  const { finalData } = useSearchNumber(debouncedQuery);

  return (
    <div>
      <div className="my-4 flex gap-x-4 justify-between items-center">
        <Input
          onChange={(e) => setQuery(e.target.value)}
          className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
          placeholder="Search"
        />
        <Button className="bg-blue-400 hover:bg-blue-400/90">Search</Button>
      </div>

      <div className="mt-8">
        <p>Results</p>
      </div>

      {query === "" && (
        <div className="h-[400px] flex justify-center items-center flex-col  gap-y-2">
          <Search size={42} />
          <p className="font-semibold">Search any number</p>
        </div>
      )}

      {finalData?.length === 0 && query !== "" && (
        <div className="h-[400px] flex justify-center items-center flex-col text-red-400 gap-y-2">
          <CircleOff size={42} />
          <p className="font-semibold">No result found!</p>
        </div>
      )}

      {finalData?.length > 0 && (
        <div className="flex flex-col gap-y-4 mt-8 h-[400px] overflow-y-scroll">
          {finalData &&
            finalData?.map((user, index) => (
              <div
                key={index}
                className="bg-blue-300/20 p-2 px-4 rounded-md drop-shadow-sm font-semibold flex justify-between items-center"
              >
                <div>
                  <p>{user?.name}</p>
                  <p className="text-sm text-black/50">{user?.phone_number}</p>
                </div>
                <div>
                  <Button
                    onClick={() =>
                      onOpen("contactDetails", {
                        userdata: {
                          email: user?.email,
                          name: user?.name,
                          phone_number: user?.phone_number,
                          spam_likelihood: user?.spam_likelihood,
                        },
                      })
                    }
                    className="bg-transparent hover:bg-transparent border-none shadow-none text-black"
                  >
                    <ArrowRight />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
      <ContactDetails />
    </div>
  );
};

interface UserSpamContact {
  phone_number: string;
}

const useSpamContact = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: UserSpamContact) => api.post("/spam_contact/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });

  return { mutate, isPending };
};

const ContactDetails = () => {
  const { isOpen, onClose, type, data } = useModal();

  const isModalOpen = isOpen && type === "contactDetails";

  const { mutate, isPending } = useSpamContact();

  const onSubmit = () => {
    mutate(
      {
        phone_number: data?.userdata?.phone_number as string,
      },
      {
        onSuccess: () => {
          toast.success("Phone number spammed successfully!");
          onClose();
        },
        onError: () => {
          toast.error("You have already reported this number as spam.");
        },
      }
    );
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[350px]">
        <p>Contact details</p>
        {(data?.userdata?.spam_likelihood && (
          <div className="flex justify-start items-center gap-x-4">
            <div>
              <div className="bg-red-400/40 h-14 w-14 text-red-400 rounded-full flex justify-center items-center">
                <ShieldAlert />
              </div>
            </div>
            <div className="text-red-400 rounded-md  px-2 text-sm">
              {data?.userdata?.spam_likelihood}% registered user things this
              contact is a spam
            </div>
          </div>
        )) || <div></div>}
        <div className="space-y-4">
          <div className="text-sm">
            <p>Name: {data?.userdata?.name}</p>
            {data?.userdata?.email && <p>Email: {data?.userdata?.email}</p>}
          </div>

          <div>
            <Button
              disabled={isPending}
              onClick={onSubmit}
              className="bg-red-400 hover:bg-red-400/90"
            >
              Spam
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
