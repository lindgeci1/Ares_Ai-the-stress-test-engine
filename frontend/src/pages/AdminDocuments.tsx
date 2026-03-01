import React, { useState, useEffect, useContext } from 'react';
import {
  FileTextIcon,
  TrashIcon,
  SearchIcon,
  DownloadIcon,
  EyeIcon,
  XIcon,
  AlertTriangleIcon } from
'lucide-react';
import { authService } from '../services/authService';
import { AuthContext } from '../context/AuthContext';

type DocStatus = 'PROCESSED' | 'PROCESSING' | 'FAILED';
type Document = {
  id: string;
  name: string;
  owner: string;
  ownerEmail: string;
  resilienceScore: number;
  fileSize: string;
  uploadDate: string;
  status: DocStatus;
  rounds: number;
};

function mapBackendStatus(status: string): DocStatus {
  switch (status?.toLowerCase()) {
    case 'processed':
      return 'PROCESSED';
    case 'processing':
      return 'PROCESSING';
    case 'pending':
      return 'PROCESSING';
    case 'failed':
      return 'FAILED';
    default:
      return 'PROCESSING';
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
}

type SortKey = 'name' | 'owner' | 'resilienceScore' | 'fileSize' | 'uploadDate';
export function AdminDocuments() {
  const authContext = useContext(AuthContext);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const backendDocs = await authService.getAllDocuments();
      
      // Fetch all users to map owner info
      let users: any[] = [];
      try {
        users = await authService.getAllUsers();
      } catch (err) {
        console.log('Could not fetch users for document mapping');
      }
      
      const mappedDocs: Document[] = backendDocs.map((doc) => {
        // Find the user for this document
        const user = users.find((u) => u.id === doc.user_id);
        
        return {
          id: String(doc.id),
          name: doc.file_name,
          owner: user?.operator_name || 'Unknown User',
          ownerEmail: user?.email || 'unknown@example.com',
          resilienceScore: doc.audit_report?.resilience_score || 0,
          fileSize: '0 MB',
          uploadDate: formatDate(doc.created_at),
          status: mapBackendStatus(doc.status),
          rounds: 0
        };
      });
      
      setDocuments(mappedDocs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('uploadDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');else
    {
      setSortKey(key);
      setSortDir('desc');
    }
  };
  const handleDelete = async (id: string) => {
    try {
      await authService.deleteDocument(Number(id));
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !authContext?.user) return;
    
    try {
      setUploading(true);
      setError(null);
      
      const newDoc = await authService.createDocument(authContext.user.id, uploadFile);
      
      const mappedDoc: Document = {
        id: String(newDoc.id),
        name: newDoc.file_name,
        owner: authContext.user.operator_name,
        ownerEmail: authContext.user.email,
        resilienceScore: newDoc.audit_report?.resilience_score || 0,
        fileSize: '0 MB',
        uploadDate: formatDate(newDoc.created_at),
        status: mapBackendStatus(newDoc.status),
        rounds: 0
      };
      
      setDocuments((prev) => [mappedDoc, ...prev]);
      setUploadModal(false);
      setUploadFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };
  const filtered = documents.
  filter(
    (d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.owner.toLowerCase().includes(search.toLowerCase())
  ).
  sort((a, b) => {
    let aVal: string | number = a[sortKey];
    let bVal: string | number = b[sortKey];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  const processedDocs = documents.filter((d) => d.status === 'PROCESSED');
  const avgScore = processedDocs.length ?
  Math.round(
    processedDocs.reduce((acc, d) => acc + d.resilienceScore, 0) /
    processedDocs.length
  ) :
  0;
  function SortIndicator({ col }: {col: SortKey;}) {
    if (sortKey !== col) return <span className="text-[#262626] ml-1">↕</span>;
    return (
      <span className="text-[#EF4444] ml-1">
        {sortDir === 'asc' ? '↑' : '↓'}
      </span>);

  }
  return (
    <div className="p-6 min-h-full">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="font-mono text-sm text-[#666]">LOADING DOCUMENTS...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 px-4 py-3 mb-4 rounded">
          <p className="font-mono text-xs text-[#EF4444]">ERROR: {error}</p>
          <button
            onClick={fetchDocuments}
            className="font-mono text-xs text-[#EF4444] hover:text-white mt-2 underline">
            RETRY
          </button>
        </div>
      )}

      {!loading && (
        <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileTextIcon className="w-4 h-4 text-[#EF4444]" />
            <h1 className="font-sans text-xl font-bold text-white tracking-wide">
              GLOBAL DOCUMENT REGISTRY
            </h1>
          </div>
          <p className="font-mono text-[10px] text-[#404040] tracking-widest">
            {documents.length} DOCUMENTS — AVG RESILIENCE: {avgScore}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#22C55E] text-[#22C55E] font-mono text-xs tracking-widest hover:bg-[#22C55E]/10 transition-colors">
            <FileTextIcon className="w-3.5 h-3.5" />
            UPLOAD DOCUMENT
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[#262626] text-[#666] font-mono text-xs tracking-widest hover:border-[#404040] hover:text-white transition-colors">
            <DownloadIcon className="w-3.5 h-3.5" />
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-[#262626] mb-5">
        <div className="bg-[#0a0a0a] px-4 py-3">
          <div className="font-mono text-lg font-bold text-white">
            {documents.filter((d) => d.status === 'PROCESSED').length}
          </div>
          <div className="font-mono text-[9px] text-[#404040] tracking-widest">
            PROCESSED
          </div>
        </div>
        <div className="bg-[#0a0a0a] px-4 py-3">
          <div className="font-mono text-lg font-bold text-yellow-400">
            {documents.filter((d) => d.status === 'PROCESSING').length}
          </div>
          <div className="font-mono text-[9px] text-[#404040] tracking-widest">
            PROCESSING
          </div>
        </div>
        <div className="bg-[#0a0a0a] px-4 py-3">
          <div className="font-mono text-lg font-bold text-[#EF4444]">
            {documents.filter((d) => d.status === 'FAILED').length}
          </div>
          <div className="font-mono text-[9px] text-[#404040] tracking-widest">
            FAILED
          </div>
        </div>
        <div className="bg-[#0a0a0a] px-4 py-3">
          <div className="font-mono text-lg font-bold text-[#22C55E]">
            {avgScore}%
          </div>
          <div className="font-mono text-[9px] text-[#404040] tracking-widest">
            AVG RESILIENCE
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#404040]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH DOCUMENTS OR OWNERS..."
          className="w-full bg-[#0a0a0a] border border-[#262626] pl-9 pr-4 py-2.5 font-mono text-xs text-white placeholder-[#333] focus:border-[#3B82F6] focus:outline-none transition-colors" />

      </div>

      {/* Table */}
      <div className="border border-[#262626] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#262626] bg-[#0a0a0a]">
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="font-mono text-[9px] text-[#404040] tracking-widest hover:text-white transition-colors">

                  DOCUMENT <SortIndicator col="name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('owner')}
                  className="font-mono text-[9px] text-[#404040] tracking-widest hover:text-white transition-colors">

                  OWNER <SortIndicator col="owner" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('resilienceScore')}
                  className="font-mono text-[9px] text-[#404040] tracking-widest hover:text-white transition-colors">

                  RESILIENCE <SortIndicator col="resilienceScore" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-mono text-[9px] text-[#404040] tracking-widest">
                STATUS
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('fileSize')}
                  className="font-mono text-[9px] text-[#404040] tracking-widest hover:text-white transition-colors">

                  SIZE <SortIndicator col="fileSize" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('uploadDate')}
                  className="font-mono text-[9px] text-[#404040] tracking-widest hover:text-white transition-colors">

                  UPLOADED <SortIndicator col="uploadDate" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-mono text-[9px] text-[#404040] tracking-widest">
                ROUNDS
              </th>
              <th className="px-4 py-3 text-left font-mono text-[9px] text-[#404040] tracking-widest">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {filtered.length === 0 &&
            <tr>
                <td
                colSpan={8}
                className="px-4 py-8 text-center font-mono text-[10px] text-[#333]">

                  NO DOCUMENTS FOUND
                </td>
              </tr>
            }
            {filtered.map((doc) => {
              const scoreColor =
              doc.resilienceScore === 0 ?
              '#404040' :
              doc.resilienceScore < 40 ?
              '#EF4444' :
              doc.resilienceScore < 70 ?
              '#EAB308' :
              '#22C55E';
              return (
                <tr
                  key={doc.id}
                  className="hover:bg-[#0a0a0a] transition-colors">

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="w-3 h-3 text-[#333] flex-shrink-0" />
                      <span className="font-mono text-[10px] text-[#888] max-w-[180px] truncate">
                        {doc.name}
                      </span>
                    </div>
                    <div className="font-mono text-[9px] text-[#333] ml-5">
                      {doc.id}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-sans text-xs text-white">
                      {doc.owner}
                    </div>
                    <div className="font-mono text-[9px] text-[#333]">
                      {doc.ownerEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-[#1a1a1a]">
                        <div
                          className="h-full"
                          style={{
                            width: `${doc.resilienceScore}%`,
                            backgroundColor: scoreColor
                          }} />

                      </div>
                      <span
                        className="font-mono text-[10px] font-bold"
                        style={{
                          color: scoreColor
                        }}>

                        {doc.resilienceScore === 0 ?
                        '—' :
                        `${doc.resilienceScore}%`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono text-[9px] font-bold px-1.5 py-0.5 tracking-widest ${doc.status === 'PROCESSED' ? 'text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20' : doc.status === 'PROCESSING' ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20' : 'text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20'}`}>

                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-[#666]">
                    {doc.fileSize}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-[#666]">
                    {doc.uploadDate}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white">
                    {doc.rounds}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewDoc(doc)}
                        className="flex items-center gap-1 px-2 py-1 border border-[#262626] text-[#666] font-mono text-[9px] tracking-widest hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors">

                        <EyeIcon className="w-3 h-3" />
                        VIEW
                      </button>
                      <button
                        onClick={() => setDeleteTarget(doc)}
                        className="flex items-center gap-1 px-2 py-1 border border-[#EF4444]/30 text-[#EF4444] font-mono text-[9px] tracking-widest hover:border-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">

                        <TrashIcon className="w-3 h-3" />
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[9px] text-[#333]">
          SHOWING {filtered.length} OF {documents.length} DOCUMENTS
        </span>
        <span className="font-mono text-[9px] text-[#333]">
          SORTED BY: {sortKey.toUpperCase()} {sortDir.toUpperCase()}
        </span>
      </div>
        </>
      )}

      {/* ── VIEW MODAL ── */}
      {viewDoc &&
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#050505] border border-[#262626] w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <FileTextIcon className="w-3.5 h-3.5 text-[#EF4444]" />
                <span className="font-mono text-xs font-bold text-white tracking-widest">
                  DOCUMENT RECORD
                </span>
              </div>
              <button
              onClick={() => setViewDoc(null)}
              className="text-[#404040] hover:text-white transition-colors">

                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-2 divide-y divide-[#1a1a1a]">
              {(
            [
            ['DOCUMENT ID', viewDoc.id],
            ['FILE NAME', viewDoc.name],
            ['FILE SIZE', viewDoc.fileSize],
            ['OWNER', viewDoc.owner],
            ['OWNER EMAIL', viewDoc.ownerEmail],
            ['STATUS', viewDoc.status],
            [
            'RESILIENCE SCORE',
            viewDoc.resilienceScore === 0 ?
            'PENDING' :
            `${viewDoc.resilienceScore}%`],

            ['BATTLE ROUNDS', String(viewDoc.rounds)],
            ['UPLOADED', viewDoc.uploadDate]] as
            [string, string][]).
            map(([label, value]) =>
            <div
              key={label}
              className="flex items-center justify-between py-2.5">

                  <span className="font-mono text-[9px] text-[#404040] tracking-widest">
                    {label}
                  </span>
                  <span
                className={`font-mono text-[10px] font-medium ${label === 'STATUS' ? viewDoc.status === 'PROCESSED' ? 'text-[#22C55E]' : viewDoc.status === 'PROCESSING' ? 'text-[#EAB308]' : 'text-[#EF4444]' : 'text-white'}`}>

                    {value}
                  </span>
                </div>
            )}
            </div>
            <div className="px-5 py-4 border-t border-[#262626] flex gap-2">
              <button
              onClick={() => {
                setDeleteTarget(viewDoc);
                setViewDoc(null);
              }}
              className="flex-1 py-2.5 border border-[#EF4444]/30 text-[#EF4444] font-mono text-xs font-bold tracking-widest hover:bg-[#EF4444]/10 transition-colors">

                DELETE
              </button>
              <button
              onClick={() => setViewDoc(null)}
              className="flex-1 py-2.5 border border-[#262626] text-[#666] font-mono text-xs font-bold tracking-widest hover:border-[#404040] hover:text-white transition-colors">

                CLOSE
              </button>
            </div>
          </div>
        </div>
      }

      {/* ── UPLOAD DOCUMENT MODAL ── */}
      {uploadModal &&
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#050505] border border-[#262626] w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <FileTextIcon className="w-3.5 h-3.5 text-[#22C55E]" />
                <span className="font-mono text-xs font-bold text-white tracking-widest">
                  UPLOAD DOCUMENT
                </span>
              </div>
              <button
              onClick={() => {
                setUploadModal(false);
                setUploadFile(null);
              }}
              className="text-[#404040] hover:text-white transition-colors">

                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <div
              onClick={() => document.getElementById('file-input')?.click()}
              className="border-2 border-dashed border-[#262626] rounded px-4 py-8 text-center cursor-pointer hover:border-[#22C55E] transition-colors">

                <FileTextIcon className="w-8 h-8 text-[#404040] mx-auto mb-2" />
                <div className="font-mono text-[10px] text-[#666]">
                  {uploadFile ? uploadFile.name : 'CLICK TO SELECT FILE OR DRAG & DROP'}
                </div>
                <div className="font-mono text-[9px] text-[#333] mt-1">
                  Supported: PDF, DOCX, DOC, TXT
                </div>
              </div>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              className={`flex-1 py-2.5 font-mono text-xs font-bold tracking-widest transition-colors ${
                !uploadFile || uploading
                  ? 'bg-[#333] text-[#666] cursor-not-allowed'
                  : 'bg-[#22C55E] text-white hover:bg-[#16a34a]'
              }`}>

                {uploading ? 'UPLOADING...' : 'UPLOAD'}
              </button>
              <button
              onClick={() => {
                setUploadModal(false);
                setUploadFile(null);
              }}
              className="flex-1 py-2.5 border border-[#262626] text-[#666] font-mono text-xs font-bold tracking-widest hover:border-[#404040] hover:text-white transition-colors">

                CANCEL
              </button>
            </div>
          </div>
        </div>
      }

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteTarget &&
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#050505] border border-[#EF4444]/30 w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="w-3.5 h-3.5 text-[#EF4444]" />
                <span className="font-mono text-xs font-bold text-[#EF4444] tracking-widest">
                  CONFIRM DELETION
                </span>
              </div>
              <button
              onClick={() => setDeleteTarget(null)}
              className="text-[#404040] hover:text-white transition-colors">

                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="font-mono text-[10px] text-[#888] leading-relaxed mb-4">
                YOU ARE ABOUT TO PERMANENTLY DELETE THIS DOCUMENT AND ALL
                ASSOCIATED AUDIT DATA. THIS ACTION CANNOT BE UNDONE.
              </p>
              <div className="bg-[#0a0a0a] border border-[#262626] px-4 py-3">
                <div className="font-mono text-xs text-white font-bold truncate">
                  {deleteTarget.name}
                </div>
                <div className="font-mono text-[9px] text-[#404040] mt-0.5">
                  {deleteTarget.id} · {deleteTarget.owner}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
              onClick={() => handleDelete(deleteTarget.id)}
              className="flex-1 py-2.5 bg-[#EF4444] text-white font-mono text-xs font-bold tracking-widest hover:bg-[#dc2626] transition-colors">

                CONFIRM DELETE
              </button>
              <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 border border-[#262626] text-[#666] font-mono text-xs font-bold tracking-widest hover:border-[#404040] hover:text-white transition-colors">

                CANCEL
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}