import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { urlConfig } from "../../config";
import { useAppContext } from "../../context/AuthContext";

const Profile = () => {
  const [userDetails, setUserDetails] = useState({});
  const [updatedDetails, setUpdatedDetails] = useState({});
  const { setUserName } = useAppContext();
  const [changed, setChanged] = useState("");

  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const authtoken = sessionStorage.getItem("auth-token");
    if (!authtoken) {
      navigate("/app/login");
    } else {
      fetchUserProfile();
    }
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      const authtoken = sessionStorage.getItem("auth-token");
      const email = sessionStorage.getItem("email");
      const name = sessionStorage.getItem("name");
      if (name || authtoken) {
        const storedUserDetails = {
          name: name,
          email: email,
        };

        setUserDetails(storedUserDetails);
        setUpdatedDetails(storedUserDetails);
      }
    } catch (error) {
      console.error(error);
      // Handle error case
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleInputChange = (e) => {
    setUpdatedDetails({
      ...updatedDetails,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const authtoken = sessionStorage.getItem("auth-token");
      const email = sessionStorage.getItem("email");

      console.log("=== PROFILE UPDATE DEBUG ===");
      console.log("Auth token:", authtoken ? "exists" : "missing");
      console.log("Email from sessionStorage:", email);
      console.log("Updated details:", updatedDetails);

      if (!authtoken || !email) {
        navigate("/app/login");
        return;
      }

      const payload = { ...updatedDetails };
      console.log("Payload being sent:", payload);

      const response = await fetch(`${urlConfig.backendUrl}/api/auth/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authtoken}`,
          "Content-Type": "application/json",
          email: email,
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        // Parse the response from server
        const responseData = await response.json();
        console.log("Response data:", responseData);

        // Update the user details in session storage with server response
        const serverName = responseData.name || updatedDetails.name;
        const serverEmail = responseData.email || updatedDetails.email;

        setUserName(serverName);
        sessionStorage.setItem("name", serverName);
        sessionStorage.setItem("email", serverEmail);
        sessionStorage.setItem("auth-token", responseData.authtoken);

        setUserDetails({ name: serverName, email: serverEmail });
        setEditMode(false);
        // Display success message to the user
        setChanged("Name Changed Successfully!");
        setTimeout(() => {
          setChanged("");
          navigate("/");
        }, 1000);
      } else {
        // Handle error case
        const errorData = await response.json();
        console.error("Update failed - Response status:", response.status);
        console.error("Error details:", errorData);
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      // Handle error case
    }
  };

  return (
    <div className="profile-container">
      {editMode ? (
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={userDetails.email}
              disabled // Disable the email field
            />
          </label>
          <label>
            Name
            <input
              type="text"
              name="name"
              value={updatedDetails.name}
              onChange={handleInputChange}
            />
          </label>

          <button type="submit">Save</button>
        </form>
      ) : (
        <div className="profile-details">
          <h1>Hi, {userDetails.name}</h1>
          <p>
            {" "}
            <b>Email:</b> {userDetails.email}
          </p>
          <button onClick={handleEdit}>Edit</button>
          <span
            style={{
              color: "green",
              height: ".5cm",
              display: "block",
              fontStyle: "italic",
              fontSize: "12px",
            }}
          >
            {changed}
          </span>
        </div>
      )}
    </div>
  );
};

export default Profile;
