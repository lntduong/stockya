"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronRight, LayoutList } from "lucide-react";
import { useRouter } from "next/navigation";
import PullToRefresh from "@/components/pull-to-refresh";

export default function Home() {
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const fetchWatchlists = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sheets');
      if (res.ok) {
        const json = await res.json();
        setWatchlists(json.data || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      setNewName("");
      setIsOpen(false);
      fetchWatchlists();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, e: any) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      try {
        await fetch(`/api/sheets?id=${id}`, { method: 'DELETE' });
        fetchWatchlists();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRefresh = async () => {
    await fetchWatchlists();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Danh mục</h1>
          <p className="text-sm text-default-500">Quản lý theo dõi cổ phiếu</p>
        </div>
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-primary text-white p-3 rounded-full shadow-lg shadow-primary/40 hover:opacity-80 transition-opacity"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <>
            <div className="h-24 w-full bg-content3/40 animate-pulse rounded-2xl" />
            <div className="h-24 w-full bg-content3/40 animate-pulse rounded-2xl" />
          </>
        ) : watchlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-default-400 gap-4">
            <LayoutList size={48} className="opacity-20" />
            <p className="text-center">Chưa có danh mục nào.<br/>Hãy tạo danh mục đầu tiên của bạn!</p>
          </div>
        ) : (
          watchlists.map(wl => (
            <div 
              key={wl.id} 
              onClick={() => router.push(`/watchlist/${wl.id}`)}
              className="w-full bg-content2/50 backdrop-blur-sm border border-white/5 hover:bg-content2 hover:scale-[1.01] transition-all rounded-2xl cursor-pointer p-5 flex flex-row justify-between items-center shadow-sm"
            >
              <div className="flex flex-col items-start">
                <p className="text-lg font-bold">{wl.name}</p>
                <p className="text-sm text-default-400 font-medium">
                  {wl.symbols ? wl.symbols.split(',').length : 0} mã cổ phiếu
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  className="p-2 text-danger opacity-60 hover:opacity-100 hover:bg-danger/10 rounded-full transition-all"
                  onClick={(e) => handleDelete(wl.id, e)}
                >
                  <Trash2 size={18} />
                </button>
                <ChevronRight size={20} className="text-default-300 ml-1" />
              </div>
            </div>
          ))
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white/10 animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Tạo danh mục mới</h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-default-500">Tên danh mục</label>
              <input 
                autoFocus
                className="w-full bg-content2 border border-white/10 rounded-xl px-4 py-3 text-lg outline-none focus:border-primary transition-colors"
                placeholder="Ví dụ: Lướt sóng T+"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button 
                className="px-4 py-2 rounded-xl text-danger hover:bg-danger/10 font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Hủy
              </button>
              <button 
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold shadow-md hover:opacity-90 transition-opacity"
                onClick={handleCreate}
              >
                Tạo mới
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PullToRefresh>
  );
}
