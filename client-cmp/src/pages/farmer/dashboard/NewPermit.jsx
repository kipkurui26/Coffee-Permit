import React, { useState, useEffect } from "react";
import { FaTrashCan } from "react-icons/fa6";
import AxiosInstance from "../../../utils/AxiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

const NewPermit = () => {
  const [currentStep, setCurrentStep] = useState(1);
  // State for Step 1 - Updated state keys to match backend
  const [locationDetails, setLocationDetails] = useState({
    factory_id: "",
    warehouse_id: "",
  });
  // State for fetched options
  const [factories, setFactories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [coffeeGrades, setCoffeeGrades] = useState([]);

  // State for Step 2
  const [selectedCoffeeGradeId, setSelectedCoffeeGradeId] = useState("");
  const [numberOfBags, setNumberOfBags] = useState("");
  const [coffeeDetailsList, setCoffeeDetailsList] = useState([]);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchCoffeeGrades();
  }, []);

  useEffect(() => {
    // Fetch factories when component mounts
    if (user?.managed_society) {
      fetchFactories();
    }
  }, [user?.managed_society]);

  useEffect(() => {
    // Fetch warehouses when factory changes
    if (locationDetails.factory_id) {
      fetchWarehouses();
    } else {
      setWarehouses([]);
      setLocationDetails((prevDetails) => ({
        ...prevDetails,
        warehouse_id: "",
      }));
    }
  }, [locationDetails.factory_id]);

  // --- Data Fetching Functions ---
  const fetchFactories = async () => {
    try {
      // Use the new active_factories endpoint
      const response = await AxiosInstance.get(
        `/societies/factories/active_factories/`
      );
      setFactories(response.data);
    } catch (error) {
      console.error("Error fetching factories:", error);
      showToast("Error loading factories", "error");
    }
  };

  const fetchWarehouses = async () => {
    try {
      // Use the new active_warehouses endpoint
      const response = await AxiosInstance.get(
        `/warehouse/warehouses/active_warehouses/`
      );
      setWarehouses(response.data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      showToast("Error loading warehouses", "error");
    }
  };

  const fetchCoffeeGrades = async () => {
    try {
      const response = await AxiosInstance.get("/permits/coffee-grades/");
      setCoffeeGrades(response.data);
    } catch (error) {
      console.error("Error fetching coffee grades:", error);
      // TODO: Display error to user
    }
  };

  // Added a check if all required location details are selected
  const isLocationDetailsComplete =
    user?.managed_society?.id &&
    locationDetails.factory_id &&
    locationDetails.warehouse_id;

  const nextStep = () => {
    if (currentStep === 1) {
      if (!isLocationDetailsComplete) {
        showToast("Please select Factory and Warehouse.", "error");
        return;
      }
    } else if (currentStep === 2) {
      if (coffeeDetailsList.length === 0) {
        showToast("Please add at least one coffee detail.", "error");
        return;
      }
    }
    setCurrentStep((prevStep) => (prevStep < 3 ? prevStep + 1 : prevStep));
  };

  const prevStep = () => {
    setCurrentStep((prevStep) => (prevStep > 1 ? prevStep - 1 : prevStep));
  };

  const handleSubmit = async () => {
    if (
      !user?.managed_society?.id ||
      !locationDetails.factory_id ||
      !locationDetails.warehouse_id ||
      coffeeDetailsList.length === 0
    ) {
      showToast(
        "Please complete all required steps before submitting.",
        "error"
      );
      return;
    }

    setLoading(true);

    const payload = {
      farmer: user?.id,
      society_id: user.managed_society.id,
      factory_id: parseInt(locationDetails.factory_id),
      warehouse_id: parseInt(locationDetails.warehouse_id),
      coffee_quantities: coffeeDetailsList.map((detail) => ({
        coffee_grade_id: parseInt(detail.grade_id),
        bags_quantity: detail.bags,
      })),
    };

    try {
      await AxiosInstance.post("/permits/permits/", payload);
      showToast("Permit application submitted successfully!", "success");
      setTimeout(() => navigate("/"), 1200);
    } catch (error) {
      const backendErrorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message;
      showToast(
        `Failed to submit permit application: ${backendErrorMessage}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Step 1 inputs - Updated to use _id keys
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocationDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value, // value here is the string ID from the option
    }));
  };

  // First, add a function to check if a grade is already added
  const isGradeAlreadyAdded = (gradeId) => {
    return coffeeDetailsList.some((detail) => detail.grade_id === gradeId);
  };

  // Update the handleCoffeeGradeChange function
  const handleCoffeeGradeChange = (e) => {
    const selectedId = e.target.value;
    if (!isGradeAlreadyAdded(selectedId)) {
      setSelectedCoffeeGradeId(selectedId);
    }
  };

  const handleNumberOfBagsChange = (e) => {
    // Allow only positive integer input
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setNumberOfBags(value);
    }
  };

  const handleAddCoffeeDetail = () => {
    if (selectedCoffeeGradeId && numberOfBags > 0) {
      const selectedGrade = coffeeGrades.find(
        (grade) => grade.id.toString() === selectedCoffeeGradeId
      );
      if (selectedGrade) {
        setCoffeeDetailsList((prevList) => [
          ...prevList,
          {
            grade_id: selectedCoffeeGradeId,
            grade_name: selectedGrade.grade,
            bags: parseInt(numberOfBags, 10),
          }, // Store ID and name
        ]);
        // Reset input fields after adding
        setSelectedCoffeeGradeId("");
        setNumberOfBags("");
      }
    } else {
      showToast(
        "Please select a coffee grade and enter a valid number of bags.",
        "error"
      );
    }
  };

  const handleDeleteCoffeeDetail = (indexToDelete) => {
    setCoffeeDetailsList((prevList) =>
      prevList.filter((_, index) => index !== indexToDelete)
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Step 1: Location Selection
            </h2>
            <p className="text-gray-600">
              Select the factory and warehouse for the permit.
            </p>
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Society
                </label>
                <input
                  type="text"
                  value={user?.managed_society?.name || "Not assigned"}
                  disabled
                  className="appearance-none relative block w-full px-3 py-2 border border-amber-300 bg-gray-50 placeholder-gray-800 text-black rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="factory_id"
                  className="block text-sm font-medium text-gray-700"
                >
                  Factory
                </label>
                <select
                  id="factory_id"
                  name="factory_id"
                  className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-800 text-black rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  value={locationDetails.factory_id}
                  onChange={handleLocationChange}
                  disabled={!user?.managed_society?.id}
                >
                  <option value="">-- Select Factory --</option>
                  {factories.map((factory) => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="warehouse_id"
                  className="block text-sm font-medium text-gray-700"
                >
                  Warehouse
                </label>
                <select
                  id="warehouse_id"
                  name="warehouse_id"
                  className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-800 text-black rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                  value={locationDetails.warehouse_id}
                  onChange={handleLocationChange}
                  disabled={!locationDetails.factory_id}
                >
                  <option value="">-- Select Warehouse --</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Step 2: Coffee Details
            </h2>
            <p className="text-gray-600">
              Add details about the coffee grades and number of bags.
            </p>
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-1">
                  <label
                    htmlFor="coffee-grade"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Coffee Grade
                  </label>
                  <select
                    id="coffee-grade"
                    name="coffee-grade"
                    className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-800 text-black rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                    value={selectedCoffeeGradeId}
                    onChange={handleCoffeeGradeChange}
                  >
                    <option value="">-- Select Grade --</option>
                    {coffeeGrades.map((grade) => (
                      <option
                        key={grade.id}
                        value={grade.id}
                        disabled={isGradeAlreadyAdded(grade.id)}
                        className={
                          isGradeAlreadyAdded(grade.id) ? "text-gray-400" : ""
                        }
                      >
                        {grade.grade}{" "}
                        {isGradeAlreadyAdded(grade.id) ? "(Already Added)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label
                    htmlFor="number-of-bags"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Number of Bags
                  </label>
                  <input
                    type="number"
                    name="number-of-bags"
                    id="number-of-bags"
                    className="appearance-none relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-800 text-black rounded-md focus:outline-none focus:ring-amber-600 focus:border-amber-600 text-sm"
                    value={numberOfBags}
                    onChange={handleNumberOfBagsChange}
                    min="1"
                  />
                </div>
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddCoffeeDetail}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm"
                    disabled={!selectedCoffeeGradeId || numberOfBags <= 0}
                  >
                    Add Coffee
                  </button>
                </div>
              </div>

              {coffeeDetailsList.length > 0 && (
                <div className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Grade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bags
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Weight per Bag (kg)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Weight (kg)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {coffeeDetailsList.map((detail, index) => {
                          const selectedGrade = coffeeGrades.find(
                            (grade) => grade.id.toString() === detail.grade_id
                          );
                          const totalWeight = selectedGrade
                            ? detail.bags * selectedGrade.weight_per_bag
                            : 0;

                          return (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {detail.grade_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {detail.bags}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {selectedGrade?.weight_per_bag || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {totalWeight}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteCoffeeDetail(index)
                                  }
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <FaTrashCan className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-50 font-bold">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            Total
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {coffeeDetailsList.reduce(
                              (sum, detail) => sum + detail.bags,
                              0
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            -
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {coffeeDetailsList.reduce((sum, detail) => {
                              const selectedGrade = coffeeGrades.find(
                                (grade) =>
                                  grade.id.toString() === detail.grade_id
                              );
                              return (
                                sum +
                                detail.bags *
                                  (selectedGrade?.weight_per_bag || 0)
                              );
                            }, 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {coffeeDetailsList.length === 0 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  No coffee details added yet.
                </p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Step 3: Review
            </h2>
            <p className="text-gray-600">
              Review all the details before submitting the permit application.
            </p>

            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              {/* Location Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Location Details
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 w-1/4">
                          Society
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user?.managed_society?.name || "N/A"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                          Factory
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {factories.find(
                            (f) => f.id === parseInt(locationDetails.factory_id)
                          )?.name || "N/A"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                          Warehouse
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {warehouses.find(
                            (w) =>
                              w.id === parseInt(locationDetails.warehouse_id)
                          )?.name || "N/A"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coffee Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Coffee Details
                </h3>
                {coffeeDetailsList.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No coffee details added.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Grade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bags
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Weight per Bag (kg)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Weight (kg)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {coffeeDetailsList.map((detail, index) => {
                          const selectedGrade = coffeeGrades.find(
                            (grade) => grade.id.toString() === detail.grade_id
                          );
                          const totalWeight = selectedGrade
                            ? detail.bags * selectedGrade.weight_per_bag
                            : 0;

                          return (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {detail.grade_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {detail.bags}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {selectedGrade?.weight_per_bag || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {totalWeight}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-50 font-bold">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            Total
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {coffeeDetailsList.reduce(
                              (sum, detail) => sum + detail.bags,
                              0
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            -
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {coffeeDetailsList.reduce((sum, detail) => {
                              const selectedGrade = coffeeGrades.find(
                                (grade) =>
                                  grade.id.toString() === detail.grade_id
                              );
                              return (
                                sum +
                                detail.bags *
                                  (selectedGrade?.weight_per_bag || 0)
                              );
                            }, 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const steps = [
    { name: "Location Selection", number: 1 },
    { name: "Coffee Details", number: 2 },
    { name: "Review", number: 3 },
  ];

  return (
    <div className="min-h-screen bg-amber-50 py-4 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Mobile Back Button */}
        <div className="block sm:hidden mb-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-3 py-2 rounded-md bg-white text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            New Permit Application
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Follow the simple steps below to apply for a permit.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Steps Sidebar - sticky on mobile, sidebar on desktop */}
          <div className="w-full lg:w-1/4 bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 h-fit sticky top-0 z-10">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Application Steps
            </h2>
            <nav className="flex flex-row lg:flex-col space-x-4 lg:space-x-0 lg:space-y-4">
              {steps.map((step) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div
                    className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border-2 ${
                      currentStep === step.number
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-gray-300 text-gray-500"
                    }`}
                  >
                    {step.number}
                  </div>
                  <div
                    className={`ml-2 sm:ml-3 text-xs sm:text-sm font-medium ${
                      currentStep === step.number
                        ? "text-teal-600"
                        : "text-gray-900"
                    }`}
                  >
                    {step.name}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Form Content */}
          <div className="flex-1 w-full bg-white rounded-lg shadow-sm p-4 sm:p-6">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="mt-8">
              {/* Step 2: Next button comes first on small screens */}
              {currentStep === 2 ? (
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  {/* On small screens, Next first, then Previous */}
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 w-full sm:w-auto order-2 sm:order-none"
                      disabled={loading}
                    >
                      Previous Step
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex justify-center rounded-md bg-teal-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 w-full sm:w-auto order-1 sm:order-none"
                    disabled={loading}
                  >
                    Next Step
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 w-full sm:w-auto"
                      disabled={loading}
                    >
                      Previous Step
                    </button>
                  )}
                  {currentStep < 3 && (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="ml-auto inline-flex justify-center rounded-md bg-teal-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 w-full sm:w-auto"
                      disabled={loading}
                    >
                      Next Step
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPermit;
