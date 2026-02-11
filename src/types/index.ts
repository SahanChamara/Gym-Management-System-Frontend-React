export interface Member {
    memberId?: string;
    name: string;
    age: number;
    height?: number;
    weight?: number;
    nicNumber: string;
    email: string;
    address?: string;
    qrCodeData?: string;
    fingerprintData?: string;
    faceImageData?: string;
    membershipStartDate: string;
    activeStatus: boolean;
    mobileNumber?: string;
}

export interface Attendance {
    attendanceId?: string;
    memberId: string;
    date: string;
    timeIn: string;
    timeOut?: string;
    name?: string;
    nicNumber?: string;
    mobileNumber?: string;
}

export interface Notification {
    read: boolean;
    notificationId?: string
    message: string
    dateCreated: string
    isRead: boolean
    type: string
}

export interface Payment {
    paymentId?: string;
    memberId: string;
    amount: number;
    paymentDate: string;
    validUntilDate: string;
    paymentStatus: string;
}