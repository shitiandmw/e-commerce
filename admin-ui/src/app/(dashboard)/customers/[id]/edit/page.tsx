"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { useCustomer, useUpdateCustomer } from "@/hooks/use-customers"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type CustomerFormValues = z.infer<ReturnType<typeof createCustomerSchema>>

function createCustomerSchema(emailValidation: string) {
  return z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email(emailValidation),
    phone: z.string().optional(),
    company_name: z.string().optional(),
  })
}

export default function CustomerEditPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations("customers")
  const customerId = params.id as string

  const { data: customer, isLoading: isLoadingCustomer } =
    useCustomer(customerId)
  const updateCustomer = useUpdateCustomer(customerId)

  const customerSchema = createCustomerSchema(t("edit.fields.emailValidation"))

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company_name: "",
    },
  })

  // Populate form when customer data loads
  useEffect(() => {
    if (customer) {
      reset({
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        company_name: customer.company_name || "",
      })
    }
  }, [customer, reset])

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      await updateCustomer.mutateAsync({
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
        email: data.email,
        phone: data.phone || undefined,
        company_name: data.company_name || undefined,
      })
      router.push(`/customers/${customerId}`)
    } catch {
      // Error is handled by mutation state
    }
  }

  if (isLoadingCustomer) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/customers")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("detail.backToCustomers")}
        </button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-destructive">{t("detail.customerNotFound")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push(`/customers/${customerId}`)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("edit.backToCustomer")}
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("edit.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("edit.description", { email: customer.email })}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-base font-semibold">{t("edit.basicInformation")}</h2>
          </div>
          <div className="p-6 space-y-5">
            {/* First Name & Last Name */}
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label={t("edit.fields.firstName")}
                error={errors.first_name?.message}
              >
                <input
                  type="text"
                  {...register("first_name")}
                  placeholder={t("edit.fields.firstNamePlaceholder")}
                  className={cn(
                    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    errors.first_name && "border-destructive"
                  )}
                />
              </FormField>

              <FormField label={t("edit.fields.lastName")} error={errors.last_name?.message}>
                <input
                  type="text"
                  {...register("last_name")}
                  placeholder={t("edit.fields.lastNamePlaceholder")}
                  className={cn(
                    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    errors.last_name && "border-destructive"
                  )}
                />
              </FormField>
            </div>

            {/* Email */}
            <FormField label={t("edit.fields.email")} error={errors.email?.message} required>
              <input
                type="email"
                {...register("email")}
                placeholder={t("edit.fields.emailPlaceholder")}
                className={cn(
                  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  errors.email && "border-destructive"
                )}
              />
            </FormField>

            {/* Phone */}
            <FormField label={t("edit.fields.phone")} error={errors.phone?.message}>
              <input
                type="tel"
                {...register("phone")}
                placeholder={t("edit.fields.phonePlaceholder")}
                className={cn(
                  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  errors.phone && "border-destructive"
                )}
              />
            </FormField>

            {/* Company */}
            <FormField
              label={t("edit.fields.companyName")}
              error={errors.company_name?.message}
            >
              <input
                type="text"
                {...register("company_name")}
                placeholder={t("edit.fields.companyNamePlaceholder")}
                className={cn(
                  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  errors.company_name && "border-destructive"
                )}
              />
            </FormField>
          </div>
        </div>

        {/* Error message */}
        {updateCustomer.isError && (
          <div className="rounded-md bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              {t("edit.failedToUpdate")}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/customers/${customerId}`)}
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            {t("edit.cancel")}
          </button>
          <button
            type="submit"
            disabled={updateCustomer.isPending || !isDirty}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {updateCustomer.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t("edit.saveChanges")}
          </button>
        </div>
      </form>
    </div>
  )
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
