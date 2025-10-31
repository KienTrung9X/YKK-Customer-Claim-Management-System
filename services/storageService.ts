import { supabase } from './supabaseClient';

export const storageService = {
  async uploadFile(file: File, folder: string = 'attachments'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('claim-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('claim-files')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async deleteFile(url: string): Promise<void> {
    const path = url.split('/claim-files/')[1];
    if (!path) return;

    const { error } = await supabase.storage
      .from('claim-files')
      .remove([path]);

    if (error) throw error;
  }
};
