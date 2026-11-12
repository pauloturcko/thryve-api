export interface CreateProfilePictureDto {
    id: string,
    userId: number,
    contentType: string,
    data: Buffer
}
