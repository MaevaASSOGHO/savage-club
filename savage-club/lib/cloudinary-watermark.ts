// lib/cloudinary-watermark.ts
// Ajoute un watermark gravé dans l'image via l'URL Cloudinary
// Plus sécurisé que le watermark CSS — le fichier servi contient déjà le watermark

/**
 * Transforme une URL Cloudinary pour ajouter un watermark texte tuilé
 * @param url      URL Cloudinary originale
 * @param username Username à afficher dans le watermark
 * @returns        URL transformée avec watermark gravé
 */
export function addCloudinaryWatermark(url: string, username: string): string {
  if (!url || !url.includes("cloudinary.com")) return url;

  // Encoder le username pour l'URL (remplacer les caractères spéciaux)
  const encodedText = encodeURIComponent(`@${username}`)
    .replace(/%20/g, "_")
    .replace(/%40/g, "@")
    .replace(/[^a-zA-Z0-9@._-]/g, "_");

  // Transformation Cloudinary :
  // l_text:Arial_14:@username  → overlay texte
  // co_white                   → couleur blanche
  // o_20                       → opacité 20%
  // a_-15                      → rotation -15°
  // fl_tiled                   → tuilé sur toute l'image
  const watermarkTransform = `l_text:Arial_14:${encodedText},co_white,o_20,a_-15,fl_tiled`;

  // Insérer la transformation après /upload/
  return url.replace("/upload/", `/upload/${watermarkTransform}/`);
}

/**
 * Version pour les vidéos — Cloudinary ne supporte pas fl_tiled sur les vidéos
 * On ajoute juste un overlay centré
 */
export function addCloudinaryVideoWatermark(url: string, username: string): string {
  if (!url || !url.includes("cloudinary.com")) return url;

  const encodedText = encodeURIComponent(`@${username}`)
    .replace(/%20/g, "_")
    .replace(/%40/g, "@")
    .replace(/[^a-zA-Z0-9@._-]/g, "_");

  // Pour les vidéos : overlay centré, tuilé si supporté
  const watermarkTransform = `l_text:Arial_16:${encodedText},co_white,o_25,a_-15,g_center`;

  return url.replace("/upload/", `/upload/${watermarkTransform}/`);
}
