const StatCard = ({ title, value, icon, color }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex items-end">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
            <div className={`text-3xl pl-3 rounded-full pb-1 ${color}`}>
                {icon}
            </div>
        </div>
    );
};

export default StatCard;