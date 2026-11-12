import sharp from "sharp";

export const PROFILE_PICTURE_CONTENT_TYPE = "image/webp";

const PROFILE_PICTURE_SIZE = 512;
const ACCEPTED_FORMATS: string[] = ["jpeg", "png", "webp"];

// Sem esse teto o sharp aceita imagens de até ~268 megapixels: um PNG pequeno e muito comprimido pode descompactar em gigabytes de memória (decompression bomb). 50 MP cobre câmera de celular.
const MAX_INPUT_PIXELS = 50_000_000;

// Devolve null quando o buffer não é uma imagem JPG, PNG ou WebP válida. O mimetype que o navegador manda não é confiável, então quem decide se é imagem é a tentativa de decodificar.
export async function processProfilePicture(buffer: Buffer): Promise<Buffer | null> {
    try {
        const image = sharp(buffer, {limitInputPixels: MAX_INPUT_PIXELS});

        const {format} = await image.metadata();
        if (!ACCEPTED_FORMATS.includes(format)) {
            return null;
        }

        return await image
            .autoOrient()
            .resize(PROFILE_PICTURE_SIZE, PROFILE_PICTURE_SIZE, {fit: "cover"})
            .webp({quality: 80})
            .toBuffer();
    } catch {
        return null;
    }
}
