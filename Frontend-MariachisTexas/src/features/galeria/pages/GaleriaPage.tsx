import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Trash2, Plus, Upload, X, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight, Eye, AlertTriangle, Home } from 'lucide-react';
import { galeriaService } from '../services/galeria.service';
import { GaleriaItem } from '@/types';

import toast from 'react-hot-toast';


export const GaleriaPage: React.FC = () => {
  const [images, setImages] = useState<GaleriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

    if (images.length >= 9) {
      toast.error('La galería ya tiene el límite máximo de 9 imágenes');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const newItem = await galeriaService.upload(formData);
      setImages(prev => [...prev, newItem]);
      toast.success('Imagen subida correctamente');
      closeModal();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Error al subir la imagen';
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const goToNext = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      setIsDeleting(true);
      await galeriaService.delete(deleteConfirmId);
      setImages(prev => prev.filter(img => img.id !== deleteConfirmId));
      toast.success('Imagen eliminada correctamente');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Error al eliminar la imagen');
    } finally {
      setIsDeleting(false);
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
            <p className="text-zinc-500 font-medium tracking-wide uppercase text-xs flex items-center gap-2">
              <span>Personaliza las imágenes que ven tus clientes en la landing page</span>
              <span className="font-bold text-[#ce1126] bg-[#ce1126]/10 px-2 py-0.5 rounded-full">
                {images.length}/9 imágenes
              </span>
            </p>
          </motion.div>

          <motion.button
            whileHover={images.length >= 9 ? {} : { scale: 1.05 }}
            whileTap={images.length >= 9 ? {} : { scale: 0.95 }}
            onClick={() => {
              if (images.length >= 9) {
                toast.error('Has alcanzado el límite máximo de 9 imágenes. Elimina alguna para poder subir una nueva.');
                return;
              }
              setIsModalOpen(true);
            }}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${
              images.length >= 9 
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                : 'bg-[#ce1126] text-white shadow-[#ce1126]/20 hover:bg-[#b00e20]'
            }`}
          >
            <Plus size={20} />
            Añadir Imagen {images.length >= 9 && '(Límite alcanzado)'}
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
                  onClick={() => openLightbox(idx)}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          localStorage.setItem('landing_bg', img.url);
                          toast.success('Imagen de inicio actualizada');
                        }}
                        className="p-2 bg-blue-500/80 backdrop-blur-sm rounded-full text-white hover:bg-blue-600 transition-all duration-200 hover:scale-110"
                        title="Establecer como fondo de inicio"
                      >
                        <Home size={18} />
                      </button>
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
                        <Eye size={18} />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(img.id); }}
                        className="p-2 bg-red-500/80 backdrop-blur-sm rounded-full text-white hover:bg-red-600 transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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

      {/* Lightbox Preview */}
      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />

            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300 hover:rotate-90 border border-white/20"
            >
              <X size={24} />
            </button>

            {/* Image Counter */}
            <div className="absolute top-6 left-6 z-50 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-bold border border-white/20">
              {lightboxIndex + 1} / {images.length}
            </div>

            {/* Previous Arrow */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-4 md:left-8 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300 border border-white/20 hover:scale-110"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Next Arrow */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 md:right-8 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300 border border-white/20 hover:scale-110"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* Main Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative z-40 max-w-[90vw] max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[lightboxIndex]?.url}
                alt={`Galería ${lightboxIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] border border-white/10"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteConfirmId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Red accent top bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-red-600 to-orange-500" />

              <div className="p-8 flex flex-col items-center text-center">
                {/* Warning Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 border-2 border-red-100"
                >
                  <AlertTriangle size={40} className="text-red-500" />
                </motion.div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">¿Eliminar imagen?</h3>

                {/* Description */}
                <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mb-6">
                  Esta acción no se puede deshacer. La imagen será eliminada permanentemente de la galería.
                </p>

                {/* Preview of image to delete */}
                {(() => {
                  const imgToDelete = images.find(img => img.id === deleteConfirmId);
                  return imgToDelete ? (
                    <div className="w-full h-32 rounded-xl overflow-hidden mb-8 border border-zinc-100 shadow-inner">
                      <img
                        src={imgToDelete.url}
                        alt="Preview"
                        className="w-full h-full object-cover opacity-70"
                      />
                    </div>
                  ) : null;
                })()}

                {/* Buttons */}
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    disabled={isDeleting}
                    className="flex-1 py-3.5 rounded-xl font-bold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-all duration-200 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Eliminar
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
