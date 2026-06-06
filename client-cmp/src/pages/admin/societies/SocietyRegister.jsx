import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../../utils/AxiosInstance";
import { useToast } from "../../../context/ToastContext";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";

const steps = ["Primary Details", "Society Details", "Review & Submit"];

const SocietyRegister = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    getValues,
    reset,
    trigger,
  } = useForm({
    defaultValues: {
      email: "",
      phone_no: "",
      first_name: "",
      last_name: "",
      society_name: "",
      county: "",
      sub_county: "",
    },
    mode: "onTouched",
  });

  // Updated nextStep to validate current step fields
  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 0) {
      fieldsToValidate = ["email", "phone_no"];
    } else if (step === 1) {
      fieldsToValidate = [
        "first_name",
        "last_name",
        "society_name",
        "county",
        "sub_county",
      ];
    }
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await AxiosInstance.post("/societies/admin/societies/register/", data);
      showToast("Society and manager registered! Credentials sent to email.", "success");
      reset();
      setStep(0);
    } catch (err) {
      showToast(err.response?.data?.error || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // For review step
  const allValues = getValues();

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 mt-8 space-y-6">
      {/* Back Button */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-amber-700 hover:text-amber-900 flex items-center"
        >
          <ArrowLeftIcon className="h-6 w-6 mr-1" />
          Back
        </button>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex space-x-2">
        {steps.map((label, idx) => (
          <div
            key={label}
            className={`flex-1 text-center py-2 rounded ${
              step === idx ? "bg-amber-200 font-bold" : "bg-gray-100"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                type="email"
                placeholder="Manager Email"
                className="w-full border border-amber-300 rounded px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <input
                {...register("phone_no", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^\d{10,15}$/,
                    message: "Enter a valid phone number (10-15 digits)",
                  },
                })}
                type="text"
                placeholder="Manager Phone"
                className="w-full border border-amber-300 rounded px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              />
              {errors.phone_no && <p className="text-red-600 text-xs mt-1">{errors.phone_no.message}</p>}
            </div>
            <button
              type="button"
              className="mt-4 bg-amber-700 text-white px-4 py-2 rounded"
              onClick={nextStep}
            >
              Next
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <input
                {...register("first_name", {
                  required: "First name is required",
                  minLength: { value: 2, message: "Min 2 characters" },
                  maxLength: { value: 50, message: "Max 50 characters" },
                })}
                placeholder="Manager First Name"
                className="w-full border border-amber-300 rounded px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              />
              {errors.first_name && <p className="text-red-600 text-xs mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <input
                {...register("last_name", {
                  required: "Last name is required",
                  minLength: { value: 2, message: "Min 2 characters" },
                  maxLength: { value: 50, message: "Max 50 characters" },
                })}
                placeholder="Manager Last Name"
                className="w-full border border-amber-300 rounded px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              />
              {errors.last_name && <p className="text-red-600 text-xs mt-1">{errors.last_name.message}</p>}
            </div>
            <div>
              <input
                {...register("society_name", {
                  required: "Society name is required",
                  minLength: { value: 2, message: "Min 2 characters" },
                  maxLength: { value: 100, message: "Max 100 characters" },
                })}
                placeholder="Society Name"
                className="w-full border border-amber-300 rounded px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              />
              {errors.society_name && <p className="text-red-600 text-xs mt-1">{errors.society_name.message}</p>}
            </div>
            <div>
              <input
                {...register("county", {
                  required: "County is required",
                  minLength: { value: 2, message: "Min 2 characters" },
                  maxLength: { value: 100, message: "Max 100 characters" },
                })}
                placeholder="County"
                className="w-full border border-amber-300 rounded px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              />
              {errors.county && <p className="text-red-600 text-xs mt-1">{errors.county.message}</p>}
            </div>
            <div>
              <input
                {...register("sub_county", {
                  required: "Sub-county is required",
                  minLength: { value: 2, message: "Min 2 characters" },
                  maxLength: { value: 100, message: "Max 100 characters" },
                })}
                placeholder="Sub-County"
                className="w-full border border-amber-300 rounded px-3 py-2 focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
              />
              {errors.sub_county && <p className="text-red-600 text-xs mt-1">{errors.sub_county.message}</p>}
            </div>
            <div className="flex justify-between mt-4">
              <button
                type="button"
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={prevStep}
              >
                Back
              </button>
              <button
                type="button"
                className="bg-amber-700 text-white px-4 py-2 rounded"
                onClick={nextStep}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Review Details</h2>
            <ul className="mb-4">
              {Object.entries(allValues).map(([k, v]) => (
                <li key={k}>
                  <span className="font-medium capitalize">
                    {k.replace("_", " ")}
                  </span>{" "}
                  {v}
                </li>
              ))}
            </ul>
            <div className="text-sm text-gray-600 mb-4">
              <strong>Password:</strong> Will be auto-generated and sent to the manager's email.
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={prevStep}
              >
                Back
              </button>
              <button
                type="submit"
                className="bg-amber-700 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? "Registering..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SocietyRegister;
