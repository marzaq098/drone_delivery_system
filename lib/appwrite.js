
import { Client, Account, Avatars} from "appwrite";

export const client = new Client()
    .setProject("6971ead8003b798a3969")
    .setEndpoint("https://fra.cloud.appwrite.io/v1");

export const account = new Account(client);
export const avatars = new Avatars(client);
export const databases = null;
export const storage = null;
export const functions = null;
export const teams = null;