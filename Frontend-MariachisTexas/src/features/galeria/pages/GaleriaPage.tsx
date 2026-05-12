import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Trash2, Plus, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { galeriaService } from '../services/galeria.service';
import { GaleriaItem } from '@/types';
import { ActionButton } from '@/shared/components/ActionButton';

import toast from 'react-hot-toast';


export const GaleriaPage: React.FC = () => {
  const [images, setImages] = useState<GaleriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const data = await galeriaService.getAll();
      setImages(data);
    } catch (error) {
      toast.error('Error al cargar la galería');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede superar los 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const newItem = await galeriaService.upload(formData);
      setImages(prev => [...prev, newItem]);
      toast.success('Imagen subida correctamente');
      closeModal();
    } catch (error) {
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;

    try {
      await galeriaService.delete(id);
      setImages(prev => prev.filter(img => img.id !== id));
      toast.success('Imagen eliminada');
    } catch (error) {
      toast.error('Error al eliminar la imagen');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 p-4 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">
              Gestión de <span className="text-[#ce1126]">Galería</span>
            </h1>
            <p className="text-zinc-500 font-medium tracking-wide uppercase text-xs">
              Personaliza las imágenes que ven tus clientes en la landing page
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ce1126] text-white rounded-xl font-bold shadow-lg shadow-[#ce1126]/20 transition-all hover:bg-[#b00e20]"
          >
            <Plus size={20} />
            Añadir Imagen
          </motion.button>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 size={40} className="animate-spin text-[#ce1126] mb-4" />
            <p className="text-zinc-400 animate-pulse">Cargando galería...</p>
          </div>
        ) : images.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50"
          >
            <ImageIcon size={64} className="text-zinc-200 mb-4" />
            <p className="text-zinc-500 text-lg">No hay imágenes en la galería aún.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-[#ce1126] font-bold hover:underline"
            >
              Sube tu primera imagen
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode='popLayout'>
              {images.map((img, idx) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <img 
                    src={img.url} 
                    alt={img.titulo || 'Gallery item'} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-between p-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Imagen {idx + 1}</span>
                    </div>
                    <ActionButton 
                      icon={Trash2}
                      onClick={() => handleDelete(img.id)}
                      tooltip="Eliminar Imagen"
                      variant="danger"
                      size={18}
                    />

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 flex items-center justify-between border-b border-zinc-100">
                <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-900">
                  <Camera size={24} className="text-[#ce1126]" />
                  Subir Nueva Imagen
                </h3>
                <button onClick={closeModal} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                <div 
                  className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden
                    ${previewUrl ? 'border-transparent bg-zinc-50' : 'border-zinc-200 hover:border-[#ce1126] bg-zinc-50/50'}
                  `}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">Cambiar Imagen</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-[#ce1126]/10 rounded-2xl text-[#ce1126]">
                        <Upload size={32} />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-zinc-600">Click para seleccionar</p>
                        <p className="text-xs text-zinc-400 mt-1">JPG, PNG o WEBP (Máx. 5MB)</p>
                      </div>
                    </>
                  )}
                  <input 
                    type="file" 
                    id="fileInput" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                </div>

                <div className="mt-8 flex gap-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-4 rounded-xl font-bold text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="flex-[2] py-4 bg-[#ce1126] disabled:bg-zinc-100 disabled:text-zinc-300 text-white rounded-xl font-bold shadow-lg shadow-[#ce1126]/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        Confirmar Subida
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
