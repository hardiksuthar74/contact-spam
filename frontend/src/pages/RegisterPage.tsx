import { api } from "@/api/config";
import { VerifyEmailModal } from "@/components/modals/VerifyEmailModal";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModal } from "@/hooks/use-modal-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

interface CountryData {
  id: number;
  name: string;
}

interface CityData {
  id: number;
  name: string;
}

const useCountry = () => {
  const { data, isLoading } = useQuery({
    queryFn: () => api.get("/country/"),
    queryKey: ["allCountry"],
  });

  const finalData = data?.data as CountryData[];

  return { finalData, isLoading };
};

const useCity = (country_id: string) => {
  const { data, isLoading } = useQuery({
    queryFn: () => api.get(`/city/${country_id}}`),
    queryKey: ["allCountry", country_id],
  });

  const finalData = data?.data as CityData[];

  return { finalData, isLoading };
};

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  city?: string | null | undefined;
  country?: string | null | undefined;
}

const useRegister = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: (data: RegisterForm) => api.post("/register/", data),
  });

  return { mutate, isPending };
};

const formSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters long" })
      .max(50, { message: "Name must be at most 50 characters long" }),
    email: z
      .string()
      .min(2, { message: "Email must be at least 2 characters long" })
      .max(50, { message: "Email must be at most 50 characters long" })
      .email({ message: "Invalid email format" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(50, { message: "Password must be at most 50 characters long" }),
    confirmPassword: z
      .string()
      .min(8, {
        message: "Confirm password must be at least 8 characters long",
      })
      .max(50, {
        message: "Confirm password must be at most 50 characters long",
      }),
    phone_number: z
      .string()
      .min(10, { message: "Phone number must be at least 10 digits long" })
      .max(15, { message: "Phone number must be at most 15 digits long" })
      .regex(/^\d{10,15}$/, {
        message: "Phone number must contain only digits",
      }),
    city: z.optional(z.string()).nullable(),
    country: z.optional(z.string()).nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const RegisterPage = () => {
  const { mutate, isPending } = useRegister();
  const [country, setCountry] = useState("");
  const { finalData: countryData } = useCountry();
  const { finalData: cityData } = useCity(country);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      city: "",
      country: "",
      email: "",
      name: "",
      password: "",
      phone_number: "",
      confirmPassword: "",
    },
  });

  const { onOpen } = useModal();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values, {
      onSuccess: () => {
        onOpen("emailVerify", {
          userdata: {
            email: values?.email,
          },
        });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (error: any) => {
        const finalError = error?.response?.data;

        const { phone_number, email } = finalError;
        const mobileError = phone_number?.[0];
        const emailError = email?.[0];
        const setError = (field: "email" | "phone_number", message: string) => {
          if (message) {
            form.setError(field, { message });
          }
        };
        setError("email", emailError);
        setError("phone_number", mobileError);
      },
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen ">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Create a new account
        </h2>
        <Form {...form}>
          <form
            className="grid grid-cols-2 gap-x-4 gap-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        placeholder="Enter name"
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
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        placeholder="Enter phone number"
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      Confirm Password
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
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setCountry(value);
                        form.setValue("city", undefined);
                      }}
                      value={field?.value as string}
                    >
                      <FormControl className="col-span-1">
                        <SelectTrigger className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countryData &&
                          countryData?.map((country, index) => (
                            <SelectItem key={index} value={`${country?.id}`}>
                              {country?.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field?.value as string}
                    >
                      <FormControl className="col-span-1">
                        <SelectTrigger className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cityData &&
                          cityData?.map((city, index) => (
                            <SelectItem key={index} value={`${city?.id}`}>
                              {city?.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2">
              <Button
                disabled={isPending}
                type="submit"
                className="w-full bg-blue-400 hover:bg-blue-400/90 rounded-md"
              >
                Register
              </Button>
            </div>
          </form>
        </Form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-400 hover:text-blue-500"
          >
            login
          </Link>
        </p>
      </div>
      <VerifyEmailModal />
    </div>
  );
};
