// constants
const CHATS_REF = firebase.firestore().collection("chats");

/**
 * Fetches appropriate messages using current user id and clinic id and. 
 * If current combination of user and clinic doesn't exsist in database, 
 * new document is created.
 * @param {String} userId
 * @param {String} clinicId
 */
export async function fetchMessages(userId, clinicId) {
    let chats = await CHATS_REF
        .where("userId", "==", userId)
        .where("clinicId", "==", clinicId)
        .get();

    if (chats.docs.length == 0) {
        await createChatDocument(userId, clinicId);
        
        chats = await CHATS_REF
            .where("userId", "==", userId)
            .where("clinicId", "==", clinicId)
            .get();
    }

    let messagesRef = firebase.firestore().collection("chats/" + chats.docs[0].id + "/messages");
    let messages = await messagesRef
        .orderBy("date")
        .get();

    return {
        messages: messages,
        messagesRef: messagesRef
    };
}

/**
 * Creates new chat document of current user and clinic combination
 * in Firestore database.
 * @param {String} userId
 * @param {String} clinicId
 */
async function createChatDocument(userId, clinicId) {
    await CHATS_REF.add({
        userId: userId,
        clinicId: clinicId
    });
}

/**
 * Stores given message to current messages collection in Firestore database.
 * @param {String} sender
 * @param {String} message 
 * @param messagesRef
 */
export async function sendMessage(sender, message, messagesRef) {
    await messagesRef.add({
        date: firebase.firestore.FieldValue.serverTimestamp(),
        seen: false,
        sender: sender,
        text: message
    });
}