import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  UploadIcon,
  FileTextIcon,
  XIcon,
  ZapIcon,
  AlertTriangleIcon } from
'lucide-react';

export function NewAudit() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const auditsPerformed = user?.user_usage?.audits_performed ?? 0;
  const auditLimit = user?.user_usage?.audit_limit ?? 10;
  const remaining = Math.max(0, auditLimit - auditsPerformed);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleLaunch = async () => {
    if (!file || !user || uploading) return;

    setUploading(true);
    setError(null);

    try {
      const doc = await authService.createDocument(user.id, file);
      try {
        await refreshUser();
      } catch (refreshErr) {
        console.error('Failed to refresh user quota after upload:', refreshErr);
      }

      navigate(`/audit/${doc.id}`, {
        state: {
          isNewAudit: true,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ZapIcon className="w-4 h-4 text-[#EF4444]" />
          <h1 className="font-sans text-xl font-bold text-white tracking-wide">
            NEW AUDIT
          </h1>
        </div>
        <p className="font-mono text-[10px] text-[#404040] tracking-widest">
          UPLOAD A DOCUMENT TO INITIATE STRESS-TEST SEQUENCE
        </p>
      </div>

      {/* Scanning bar */}
      <div className="scanning-bar mb-8" />

      <div className="max-w-2xl">
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed p-16 flex flex-col items-center justify-center transition-colors cursor-pointer mb-6 ${isDragging ? 'border-[#3B82F6] bg-[#3B82F6]/5' : file ? 'border-[#22C55E] bg-[#22C55E]/5 cursor-default' : 'border-[#262626] bg-[#0a0a0a] hover:border-[#404040]'}`}>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            className="hidden" />


          {file ?
          <>
              <FileTextIcon className="w-10 h-10 text-[#22C55E] mb-4" />
              <p className="font-mono text-sm text-white font-bold mb-1">
                {file.name}
              </p>
              <p className="font-mono text-[10px] text-[#404040] mb-4">
                {(file.size / 1024).toFixed(1)} KB — READY FOR AUDIT
              </p>
              <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="flex items-center gap-1 font-mono text-[10px] text-[#EF4444] hover:text-white transition-colors">

                <XIcon className="w-3 h-3" /> REMOVE FILE
              </button>
            </> :

          <>
              <UploadIcon
              className={`w-10 h-10 mb-4 ${isDragging ? 'text-[#3B82F6]' : 'text-[#262626]'}`} />

              <p className="font-mono text-sm text-[#666] mb-2 tracking-wider">
                {isDragging ? 'DROP TO UPLOAD' : 'DRAG & DROP DOCUMENT'}
              </p>
              <p className="font-mono text-[10px] text-[#333]">
                OR CLICK TO BROWSE
              </p>
              <p className="font-mono text-[9px] text-[#262626] mt-4">
                SUPPORTED: PDF · DOCX · TXT — MAX 50MB
              </p>
            </>
          }
        </div>

        {/* Warning */}
        <div
          className={`flex items-start gap-3 border p-4 mb-6 ${
            remaining > 0
              ? 'border-[#EAB308]/20 bg-[#EAB308]/5'
              : 'border-[#EF4444]/20 bg-[#EF4444]/5'
          }`}>
          <AlertTriangleIcon
            className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
              remaining > 0 ? 'text-[#EAB308]' : 'text-[#EF4444]'
            }`}
          />
          <p
            className={`font-mono text-[10px] leading-relaxed ${
              remaining > 0 ? 'text-[#EAB308]' : 'text-[#EF4444]'
            }`}>
            {remaining > 0 ? (
              <>
                THIS AUDIT WILL CONSUME{' '}
                <span className="font-bold">1 OF YOUR {remaining} REMAINING QUOTA SLOTS</span>{' '}
                THIS CYCLE.
              </>
            ) : (
              <>
                <span className="font-bold">QUOTA EXHAUSTED</span> — YOU HAVE USED ALL {auditLimit} SLOTS THIS CYCLE.{' '}
                UPGRADE YOUR PLAN TO CONTINUE.
              </>
            )}
          </p>
        </div>

        {/* Launch */}
        {error && (
          <div className="mb-4 border border-[#EF4444]/40 bg-[#EF4444]/10 p-3">
            <p className="font-mono text-[10px] text-[#EF4444] tracking-wider">{error}</p>
          </div>
        )}

        <button
          onClick={handleLaunch}
          disabled={!file || remaining <= 0}
          className={`w-full py-4 font-mono text-sm font-bold tracking-widest transition-colors ${
            file && remaining > 0
              ? 'bg-[#EF4444] text-white hover:bg-[#dc2626]'
              : 'bg-[#1a1a1a] text-[#333] cursor-not-allowed'
          }`}>

          {remaining <= 0
            ? 'QUOTA EXHAUSTED — UPGRADE TO CONTINUE'
            : uploading
            ? 'UPLOADING DOCUMENT...'
            : file
            ? 'LAUNCH STRESS-TEST'
            : 'SELECT A DOCUMENT TO CONTINUE'}
        </button>
      </div>
    </div>);

}