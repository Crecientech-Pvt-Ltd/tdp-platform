"use client"

import React from "react"
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Lock, X, AlertCircle, Eye, EyeOff } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL

interface PasswordPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  selectedGroup: string
  selectedProgram: string
  selectedProject: string
}

export default function PasswordPopup({
  isOpen,
  onClose,
  onSuccess,
  selectedGroup,
  selectedProgram,
  selectedProject,
}: PasswordPopupProps) {
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)

  React.useEffect(() => {
    console.log('PasswordPopup isOpen:', isOpen);
    if (!isOpen) {
      setPassword("")
      setError("")
      setLoading(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError("Please enter a password")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${API_BASE}/data-commons/project/${encodeURIComponent(
          selectedGroup
        )}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(
          selectedProject
        )}/password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      )

      const result = await response.json()

      if (result.success) {
        onSuccess()
      } else {
        setError(result.message || "Incorrect password")
      }
    } catch (err) {
      console.error("Password check failed:", err)
      setError("Failed to verify password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault()
      handleSubmit(e as React.FormEvent)
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md w-[90vw]">
        <DialogTitle className="text-lg font-semibold flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Project Access Required
        </DialogTitle>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This project is password protected. Please enter the password to access the data analysis tools.
          </div>

          {error && (
            <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-md text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter project password"
                  disabled={loading}
                  className="mt-1 pr-10"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1 h-8 w-8 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading || !password.trim()}
            className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4" />
                Verifying...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Access Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}