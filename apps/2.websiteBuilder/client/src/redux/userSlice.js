import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: {
            name: "Guest Student",
            email: "guest@examedge.com",
            avatar: "",
            credits: 100,
            _id: "guest_user_id"
        }
    },
    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload
        }
    }

})

export const { setUserData } = userSlice.actions
export default userSlice.reducer