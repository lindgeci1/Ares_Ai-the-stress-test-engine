import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [rounds, setRounds] = useState(3);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
  const handleLaunch = () => {
    if (!file) return;
    navigate('/audit/demo-001', {
      state: {
        isNewAudit: true
      }
    });
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

        {/* Config */}
        <div className="border border-[#262626] bg-[#0a0a0a] p-5 mb-6">
          <h2 className="font-mono text-[10px] text-[#666] tracking-widest mb-4">
            AUDIT CONFIGURATION
          </h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-mono text-[9px] text-[#404040] tracking-widest mb-2">
                BATTLE ROUNDS
              </label>
              <div className="flex gap-0">
                {[3, 5, 7, 10].map((n) =>
                <button
                  key={n}
                  onClick={() => setRounds(n)}
                  className={`flex-1 py-2 font-mono text-xs font-bold border transition-colors ${rounds === n ? 'bg-[#EF4444] border-[#EF4444] text-white' : 'bg-[#050505] border-[#262626] text-[#404040] hover:border-[#404040] hover:text-white'}`}>

                    {n}
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[9px] text-[#404040] tracking-widest mb-2">
                AUDIT MODE
              </label>
              <div className="flex gap-0">
                {['STANDARD', 'DEEP'].map((mode) =>
                <button
                  key={mode}
                  className="flex-1 py-2 font-mono text-[10px] font-bold border border-[#262626] bg-[#050505] text-[#404040] hover:border-[#404040] hover:text-white transition-colors first:border-r-0">

                    {mode}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 border border-[#EAB308]/20 bg-[#EAB308]/5 p-4 mb-6">
          <AlertTriangleIcon className="w-3.5 h-3.5 text-[#EAB308] flex-shrink-0 mt-0.5" />
          <p className="font-mono text-[10px] text-[#EAB308] leading-relaxed">
            THIS AUDIT WILL CONSUME{' '}
            <span className="font-bold">1 OF YOUR 6 REMAINING QUOTA SLOTS</span>{' '}
            THIS CYCLE. DEEP MODE CONSUMES 2 SLOTS.
          </p>
        </div>

        {/* Launch */}
        <button
          onClick={handleLaunch}
          className={`w-full py-4 font-mono text-sm font-bold tracking-widest transition-colors ${file ? 'bg-[#EF4444] text-white hover:bg-[#dc2626]' : 'bg-[#1a1a1a] text-[#333] cursor-not-allowed'}`}>

          {file ? 'LAUNCH STRESS-TEST' : 'SELECT A DOCUMENT TO CONTINUE'}
        </button>
      </div>
    </div>);

}