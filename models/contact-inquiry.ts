import {
  Document,
  Model,
  Schema,
  model,
  models,
} from "mongoose";

export type ContactInquiryStatus =
  | "new"
  | "read"
  | "replied";

export interface IContactInquiry extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  message: string;
  status: ContactInquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const contactInquirySchema =
  new Schema<IContactInquiry>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 150,
      },

      phone: {
        type: String,
        trim: true,
        maxlength: 50,
      },

      company: {
        type: String,
        trim: true,
        maxlength: 150,
      },

      service: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
      },

      status: {
        type: String,
        enum: ["new", "read", "replied"],
        default: "new",
      },
    },
    {
      timestamps: true,
    },
  );

contactInquirySchema.index({
  createdAt: -1,
});

export const ContactInquiry: Model<IContactInquiry> =
  models.ContactInquiry ||
  model<IContactInquiry>(
    "ContactInquiry",
    contactInquirySchema,
  );