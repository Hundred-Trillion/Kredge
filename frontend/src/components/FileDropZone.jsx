import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, FileJson, CheckCircle, AlertCircle } from 'lucide-react'

export default function FileDropZone({
  accept,
  label,
  description,
  formatExamples,
  file,
  onFileSelect,
  error,
  fileType = 'excel', // 'excel' | 'json'
}) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || (fileType === 'excel'
      ? { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }
      : { 'application/json': ['.json'] }),
    maxFiles: 1,
    multiple: false,
  })

  const FileIcon = fileType === 'excel' ? FileSpreadsheet : FileJson
  const fileColor = fileType === 'excel' ? 'text-emerald' : 'text-electric'
  const fileBg = fileType === 'excel' ? 'bg-emerald/10' : 'bg-electric/10'
  const fileBorder = fileType === 'excel' ? 'border-emerald/30' : 'border-electric/30'

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-navy-200">
        {label}
      </label>

      <div
        {...getRootProps()}
        className={`
          relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-200 group
          ${isDragActive
            ? `${fileBorder} ${fileBg}`
            : file
              ? 'border-emerald/30 bg-emerald/5'
              : error
                ? 'border-danger/30 bg-danger/5 hover:border-danger/50'
                : 'border-surface-border hover:border-navy-400 hover:bg-navy-800/50'
          }
        `}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-emerald/10 flex items-center justify-center">
              <CheckCircle size={24} className="text-emerald" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-navy-300 mt-1">
                {(file.size / 1024).toFixed(1)} KB • Click or drop to replace
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${fileBg} flex items-center justify-center
                            group-hover:scale-110 transition-transform duration-200`}>
              {isDragActive ? (
                <Upload size={24} className={fileColor} />
              ) : (
                <FileIcon size={24} className={fileColor} />
              )}
            </div>
            <div>
              <p className="text-sm text-white">
                {isDragActive ? 'Drop file here' : description || 'Drag and drop your file here'}
              </p>
              <p className="text-xs text-navy-400 mt-1">
                or click to browse
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-danger text-xs">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {formatExamples && !file && (
        <div className="text-xs text-navy-400 space-y-1 mt-2">
          <p className="font-medium text-navy-300">Expected columns:</p>
          <div className="flex flex-wrap gap-1.5">
            {formatExamples.map((col) => (
              <span key={col} className="px-2 py-0.5 rounded bg-navy-800 text-navy-200 font-mono text-[10px]">
                {col}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
