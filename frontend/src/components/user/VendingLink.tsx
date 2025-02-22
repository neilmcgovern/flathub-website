import { useTranslation } from "next-i18next"
import { FunctionComponent, useEffect } from "react"
import { toast } from "react-toastify"
import {
  getDashboardLink,
  getOnboardingLink,
  getVendingStatus,
} from "../../asyncs/vending"
import { useAsync } from "../../hooks/useAsync"
import Button from "../Button"
import Spinner from "../Spinner"
import styles from "./VendingLink.module.scss"

/**
 * A link to the user's account for donations and payments. Will be one of:
 *
 * - Onboarding button
 * - Dashboard link (possibly with "attention needed" text)
 */
const VendingLink: FunctionComponent = () => {
  const { t } = useTranslation()

  // Status fetched when component mounts to determine what user sees
  const {
    status: getStatusRequest,
    value: status,
    error: statusError,
  } = useAsync(getVendingStatus)

  const {
    execute: getDashboard,
    status: getDashboardRequest,
    value: dashboardLink,
    error: dashboardError,
  } = useAsync(getDashboardLink, false)
  const {
    execute: getOnboarding,
    status: getOnboardingRequest,
    value: onboardingLink,
    error: onboardingError,
  } = useAsync(getOnboardingLink, false)

  // If payments can be taken, onboarding was complete
  useEffect(() => {
    if (status && status.can_take_payments) {
      getDashboard()
    }
  }, [status, getDashboard])

  // Redirect to onboard occurs if successfully retrieved, user sent back after
  useEffect(() => {
    if (onboardingLink) {
      window.location.href = onboardingLink
    }
  }, [status, onboardingLink])

  useEffect(() => {
    if (onboardingError) {
      toast.error(t(onboardingError))
    }
  }, [onboardingError, t])

  // Multiple stages of loading
  if (
    getStatusRequest === "pending" ||
    getDashboardRequest === "pending" ||
    ["pending", "success"].includes(getOnboardingRequest)
  ) {
    return <Spinner size={30} />
  }

  if (statusError || dashboardError) {
    return <p>{t(statusError || dashboardError)}</p>
  }

  // No status when onboarding hasn't begun
  // Can't pre-fetch link, it will create an account without user action
  if (!status || !status.details_submitted) {
    return (
      <Button variant="primary" onClick={getOnboarding}>
        {t("vending-onboard")}
      </Button>
    )
  }

  return (
    <div className={styles.link}>
      <a target="_blank" rel="noreferrer" href={dashboardLink}>
        {t("vending-dashboard")}
      </a>
      {status.needs_attention ? (
        <p style={{ color: "red" }}>{t("requires-attention")}</p>
      ) : (
        <></>
      )}
    </div>
  )
}

export default VendingLink
