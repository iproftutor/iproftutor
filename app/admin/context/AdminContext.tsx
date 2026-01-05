"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface CountryPack {
  code: string;
  name: string;
  flag: string;
  currency: string;
  is_active: boolean;
}

interface AdminContextType {
  selectedCountry: CountryPack | null;
  setSelectedCountry: (country: CountryPack | null) => void;
  countries: CountryPack[];
  loadingCountries: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountryState] =
    useState<CountryPack | null>(null);
  const [countries, setCountries] = useState<CountryPack[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("/api/country-packs");
        if (res.ok) {
          const data = await res.json();
          // Filter to only active countries
          const activeCountries = data.filter((c: CountryPack) => c.is_active);
          setCountries(activeCountries);

          // Restore selected country from localStorage
          const savedCode = localStorage.getItem("admin_selected_country");
          if (savedCode) {
            const saved = activeCountries.find(
              (c: CountryPack) => c.code === savedCode
            );
            if (saved) {
              setSelectedCountryState(saved);
            } else if (activeCountries.length > 0) {
              // Default to first country if saved one not found
              setSelectedCountryState(activeCountries[0]);
              localStorage.setItem(
                "admin_selected_country",
                activeCountries[0].code
              );
            }
          } else if (activeCountries.length > 0) {
            // Default to first country
            setSelectedCountryState(activeCountries[0]);
            localStorage.setItem(
              "admin_selected_country",
              activeCountries[0].code
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const setSelectedCountry = (country: CountryPack | null) => {
    setSelectedCountryState(country);
    if (country) {
      localStorage.setItem("admin_selected_country", country.code);
    } else {
      localStorage.removeItem("admin_selected_country");
    }
  };

  return (
    <AdminContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        countries,
        loadingCountries,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
