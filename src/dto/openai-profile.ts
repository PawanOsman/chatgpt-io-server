class User {
	public id: string;
	public name: string;
	public email: string;
	public image: string;
	public picture: string;
	public groups: string[];
	public features: string[];
}

class Profile {
	public user: User;
	public expires: string;
	public accessToken: string;
}

export default Profile;
