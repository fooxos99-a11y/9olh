"use client"

import type React from "react"

import { create } from "zustand"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DialogStore {
  confirm: {
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    cancelText: string
    onConfirm?: () => void
    onCancel?: () => void
  }
  alert: {
    isOpen: boolean
    title: string
    message: string
    onClose?: () => void
  }
}

const useDialogStore = create<DialogStore>((set) => ({
  confirm: {
    isOpen: false,
    title: "",
    message: "",
    confirmText: "حسناً",
    cancelText: "لا",
    onConfirm: undefined,
    onCancel: undefined,
  },
  alert: {
    isOpen: false,
    title: "",
    message: "",
    onClose: undefined,
  },
}))

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const { confirm, alert } = useDialogStore()

  const handleConfirm = () => {
    confirm.onConfirm?.()
    useDialogStore.setState((state) => ({
      ...state,
      confirm: { ...state.confirm, isOpen: false },
    }))
  }

  const handleCancel = () => {
    confirm.onCancel?.()
    useDialogStore.setState((state) => ({
      ...state,
      confirm: { ...state.confirm, isOpen: false },
    }))
  }

  const handleAlertClose = () => {
    alert.onClose?.()
    useDialogStore.setState((state) => ({
      ...state,
      alert: { ...state.alert, isOpen: false },
    }))
  }

  return (
    <>
      {children}
      {/* Confirmation Dialog */}
      <AlertDialog open={confirm.isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent className="sm:max-w-[460px] border border-[#D4AF37]/40 bg-white" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#1a2332]">{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-neutral-500 mt-1">{confirm.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 mt-4 flex-row-reverse sm:flex-row-reverse">
            <AlertDialogCancel
              onClick={handleCancel}
              className="border border-[#D4AF37]/50 text-neutral-600 hover:bg-[#D4AF37]/5 font-medium text-sm"
            >
              {confirm.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="border border-[#D4AF37]/50 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#C9A961] hover:text-[#D4AF37] font-semibold text-sm shadow-none"
            >
              {confirm.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog */}
      <AlertDialog open={alert.isOpen} onOpenChange={(open) => !open && handleAlertClose()}>
        <AlertDialogContent className="sm:max-w-[460px] border border-[#D4AF37]/40 bg-white" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#1a2332]">{alert.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-neutral-500 mt-1 whitespace-pre-line">
              {alert.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              onClick={handleAlertClose}
              className="border border-[#D4AF37]/50 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#C9A961] hover:text-[#D4AF37] font-semibold text-sm w-full shadow-none"
            >
              حسناً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface ConfirmDialogOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

export function useConfirmDialog() {
  return (options: string | ConfirmDialogOptions, fallbackTitle?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Handle both string and object formats
      const config =
        typeof options === "string"
          ? {
              title: fallbackTitle || "تأكيد العملية",
              message: options,
              confirmText: "حسناً",
              cancelText: "لا",
            }
          : {
              title: options.title || "تأكيد العملية",
              message: options.description || "",
              confirmText: options.confirmText || "حسناً",
              cancelText: options.cancelText || "لا",
            }

      useDialogStore.setState((state) => ({
        ...state,
        confirm: {
          ...config,
          isOpen: true,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        },
      }))
    })
  }
}

export function useAlertDialog() {
  return (message: string, title = "تنبيه"): Promise<void> => {
    return new Promise((resolve) => {
      useDialogStore.setState((state) => ({
        ...state,
        alert: {
          isOpen: true,
          title,
          message,
          onClose: () => resolve(),
        },
      }))
    })
  }
}
