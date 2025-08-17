


// Upload.jsx (fixed)
import { useEffect, useRef, useState } from "react"
import { useDropzone } from "react-dropzone"
import { FiUploadCloud } from "react-icons/fi"
import { useSelector } from "react-redux"

import "video-react/dist/video-react.css"
import { Player } from "video-react"

export default function Upload({
  name,
  label,
  register,
  setValue,
  errors,
  video = false,
  viewData = null,
  editData = null,
}) {
  const { course } = useSelector((state) => state.course)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewSource, setPreviewSource] = useState("")
  const inputRef = useRef(null)

  // initialize preview from viewData/editData
  useEffect(() => {
    if (viewData) {
      setPreviewSource(viewData)
      setValue(name, viewData, { shouldValidate: false })
    } else if (editData) {
      setPreviewSource(editData)
      setValue(name, editData, { shouldValidate: false })
    } else {
      setPreviewSource("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewData, editData])

  // Only update form value when user actually selects a file
  useEffect(() => {
    if (selectedFile) {
      setValue(name, selectedFile, { shouldValidate: true, shouldDirty: true })
    }
    // do not set null here (avoid overwriting editData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile])

  // register field; required only if not view/edit mode
  useEffect(() => {
    const isRequired = !viewData && !editData
    register(name, { required: isRequired })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, name, viewData, editData])

  // dropzone setup
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles?.[0]
    if (file) {
      previewFile(file)
      setSelectedFile(file)
      // debug
      // console.log("Dropped file:", file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: !video
      ? { "image/*": [".jpeg", ".jpg", ".png"] }
      : { "video/*": [".mp4"] },
    onDrop,
    multiple: false,
  })

  const previewFile = (file) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => {
      setPreviewSource(reader.result)
    }
  }

  // A defensive click handler: if dropzone click doesn't open, trigger input programmatically
  const handleClickFallback = (e) => {
    // prevent double-handling if dropzone already handled it
    if (inputRef.current && typeof inputRef.current.click === "function") {
      inputRef.current.click()
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm text-richblack-5" htmlFor={name}>
        {label} {!viewData && <sup className="text-pink-200">*</sup>}
      </label>

      {/* APPLY getRootProps ON THE OUTER VISIBLE BOX */}
      <div
        {...getRootProps({ onClick: handleClickFallback })}
        className={`${
          isDragActive ? "bg-richblack-600" : "bg-richblack-700"
        } flex min-h-[250px] cursor-pointer items-center justify-center rounded-md border-2 border-dotted border-richblack-500`}
      >
        {previewSource ? (
          <div className="flex w-full flex-col p-6">
            {!video ? (
              <img
                src={previewSource}
                alt="Preview"
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <Player aspectRatio="16:9" playsInline src={previewSource} />
            )}
            {!viewData && (
              <button
                type="button"
                onClick={() => {
                  // if editing, revert to editData (existing image) else clear
                  if (editData) {
                    setPreviewSource(editData)
                    setSelectedFile(null)
                    setValue(name, editData, { shouldValidate: false })
                    return
                  }
                  setPreviewSource("")
                  setSelectedFile(null)
                  setValue(name, null)
                }}
                className="mt-3 text-richblack-400 underline"
              >
                {editData ? "Revert" : "Cancel"}
              </button>
            )}
          </div>
        ) : (
          // The input must be present inside the element that has getRootProps
          <div className="flex w-full flex-col items-center p-6">
            {/* forward dropzone input props and our ref for fallback clicks */}
            <input {...getInputProps()} ref={inputRef} />
            <div className="grid aspect-square w-14 place-items-center rounded-full bg-pure-greys-800">
              <FiUploadCloud className="text-2xl text-yellow-50" />
            </div>
            <p className="mt-2 max-w-[200px] text-center text-sm text-richblack-200">
              Drag and drop an {!video ? "image" : "video"}, or click to{" "}
              <span className="font-semibold text-yellow-50">Browse</span> a file
            </p>
            <ul className="mt-10 flex list-disc justify-between space-x-12 text-center  text-xs text-richblack-200">
              <li>Aspect ratio 16:9</li>
              <li>Recommended size 1024x576</li>
            </ul>
          </div>
        )}
      </div>

      {errors[name] && (
        <span className="ml-2 text-xs tracking-wide text-pink-200">
          {label} is required
        </span>
      )}
    </div>
  )
}



