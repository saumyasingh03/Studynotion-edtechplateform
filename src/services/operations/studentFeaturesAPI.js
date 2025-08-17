
// src/services/operations/studentFeaturesAPI.js
import { toast } from "react-hot-toast"
import rzpLogo from "../../assets/Logo/rzp_logo.png"
import { resetCart } from "../../slices/cartSlice"
import { setPaymentLoading } from "../../slices/courseSlice"
import { apiConnector } from "../apiConnector"
import { studentEndpoints } from "../apis"

const {
  COURSE_PAYMENT_API,
  COURSE_VERIFY_API,
  SEND_PAYMENT_SUCCESS_EMAIL_API,
} = studentEndpoints

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = src
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function BuyCourse(token, courses, user_details, navigate, dispatch) {
  const toastId = toast.loading("Loading...")
  try {
    const scriptLoaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js")
    if (!scriptLoaded || !window.Razorpay) {
      toast.error("Razorpay SDK failed to load. Check your Internet Connection.")
      return
    }

    // 1) create order on backend
    const orderResponse = await apiConnector(
      "POST",
      COURSE_PAYMENT_API,
      { courses },
      { Authorization: `Bearer ${token}` }
    )

    console.log("DEBUG -> orderResponse (full):", orderResponse)

    if (!orderResponse?.data?.success) {
      throw new Error(orderResponse?.data?.message || "Could not create order")
    }

    // 2) extract server public key (try common shapes)
    const serverKey =
      orderResponse?.data?.key ||
      orderResponse?.data?.data?.key ||
      orderResponse?.data?.data?.key_id ||
      orderResponse?.data?.key_id

    console.log("DEBUG -> serverKey:", serverKey)
    if (!serverKey) {
      console.error("Payment key missing in server response:", orderResponse?.data)
      throw new Error("Payment key missing from server")
    }

    // 3) extract order data (id & amount)
    const orderData =
      orderResponse?.data?.data?.id ? orderResponse.data.data : orderResponse?.data

    if (!orderData || !orderData.id || typeof orderData.amount === "undefined") {
      console.error("Order payload invalid:", orderResponse?.data)
      throw new Error("Order payload invalid")
    }

    // 4) build options and open Razorpay
    const options = {
      key: serverKey,
      amount: Number(orderData.amount), // paise
      currency: orderData.currency || "INR",
      order_id: orderData.id,
      name: "StudyNotion",
      description: "Thank you for Purchasing the Course.",
      image: rzpLogo,
      prefill: {
        name: `${user_details.firstName || ""} ${user_details.lastName || ""}`,
        email: user_details.email || "",
      },
      handler: function (response) {
        // send email & verify on server
        sendPaymentSuccessEmail(response, orderData.amount, token)
        verifyPayment({ ...response, courses }, token, navigate, dispatch)
      },
      modal: {
        ondismiss: function () {
          console.log("Razorpay modal closed")
        },
      },
    }

    const paymentObject = new window.Razorpay(options)
    paymentObject.open()
    paymentObject.on("payment.failed", function (response) {
      toast.error("Oops! Payment Failed.")
      console.error("Razorpay payment.failed:", response.error)
    })
  } catch (error) {
    console.error("PAYMENT API ERROR............", error)
    toast.error(error.message || "Could Not make Payment.")
  } finally {
    toast.dismiss(toastId)
  }
}

// verifyPayment & sendPaymentSuccessEmail can be same as your existing implementation
async function verifyPayment(bodyData, token, navigate, dispatch) {
  const toastId = toast.loading("Verifying Payment...")
  dispatch(setPaymentLoading(true))
  try {
    const response = await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
      Authorization: `Bearer ${token}`,
    })
    console.log("VERIFY PAYMENT RESPONSE FROM BACKEND............", response)
    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    toast.success("Payment Successful. You are Added to the course ")
    navigate("/dashboard/enrolled-courses")
    dispatch(resetCart())
  } catch (error) {
    console.error("PAYMENT VERIFY ERROR............", error)
    toast.error("Could Not Verify Payment.")
  } finally {
    toast.dismiss(toastId)
    dispatch(setPaymentLoading(false))
  }
}

async function sendPaymentSuccessEmail(response, amount, token) {
  try {
    await apiConnector(
      "POST",
      SEND_PAYMENT_SUCCESS_EMAIL_API,
      {
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        amount,
      },
      {
        Authorization: `Bearer ${token}`,
      }
    )
  } catch (error) {
    console.error("PAYMENT SUCCESS EMAIL ERROR............", error)
  }
}
