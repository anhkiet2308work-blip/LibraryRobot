// Component biểu đồ tròn - Tình trạng trả sách
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ReturnStatusChart = ({ data }) => {
  // Chuyển đổi dữ liệu
  const labels = data.map(item => item.status);
  const counts = data.map(item => item.count);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Số lượng',
        data: counts,
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // green-500 - Đã trả
          'rgba(239, 68, 68, 0.8)',  // red-500 - Chưa trả
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Tình trạng trả sách',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="h-80 flex justify-center items-center">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default ReturnStatusChart;
