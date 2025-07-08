const StatCard = ({ title, value, icon, color }) => {
    return (
        <div className="bg-white p-4 rounded-lg space-y-2 shadow-md flex flex-col">
            <div className={''}>
                <p className="text-sm font-medium text-gray-500">{title}</p>
            </div>
            <div className={`flex justify-between items-end text-3xl rounded-full pb-1 ${color}`}>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                {icon}
            </div>
        </div>
    );
};

export default StatCard;