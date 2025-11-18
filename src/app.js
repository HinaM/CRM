const supabaseUrl = 'https://rvntujioqkontqqjhxdb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bnR1amlvcWtvbnRxcWpoeGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjkwNTMsImV4cCI6MjA3NTUwNTA1M30.YGPpQFss05qu3YmmHvnmfJycmhbQDTSKlzDz25Gbg6c';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

new Vue({
    el: '#app',
    data: {
      colorx:'#c72a75',
      colorx2:'#5252e8',
      activeItem: 0,
      tickets: [],
      columns: [
        { key: 'id', label: '商品編號' },
        { key: 'title', label: '商品名稱' },
        { key: 'category', label: '商品類別' },
        { key: 'price', label: '商品價格' },
        { key: 'inventory', label: '在庫數量' },
        { key: 'safety_stock', label: '安全庫存量' },
        { key: 'status', label: '狀態' }
      ],
      inventory_count: [
        { name: "可供銷售" , count : 0},
        { name: "需補貨" , count: 0},
        { name: "缺貨中" , count: 0}
      ],
      popupActivo: false,
      valueId: "",
      valueTitle: "",
      valuePrice: 0,
      valueDescription: "",
      valueLaunch: false,
      valueSafetyStock: 0
    },
    async mounted() {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .order('id', { ascending: true })
    
            if (error) throw error
            this.tickets = data

            for(let i = 0 ; i <= data.length ; i++){
              if( data[i].inventory > 0 && data[i].inventory >= data[i].safety_stock ){
                this.inventory_count[0].count ++;
              }
              else if( data[i].inventory > 0 && data[i].inventory < data[i].safety_stock ){
                this.inventory_count[1].count ++;
              }
              else{
                this.inventory_count[2].count ++;
              }
            }

    
        } catch (err) {
            console.error('Supabase select failed:', err)
        }
    },
    methods: {
      
      exportCSV() {
        const rows = this.tickets;
        const headers = this.columns;
        const getStatus = (tr) => {
          if (tr.inventory > 0 && tr.inventory >= tr.safety_stock) return "可供銷售";
          if (tr.inventory > 0 && tr.inventory < tr.safety_stock) return "需補貨";
          if (tr.inventory == 0) return "缺貨中";
          return "";
        };
      
        let csv = "";
      
        csv += headers.map(h => h.label).join(",") + "\n";
      
        
        rows.forEach(row => {
          const line = headers.map(h => {
            
            let value;
          
            if (h.key === 'status') {
              value = getStatus(row); // ⭐ 用動態計算
            } else {
              value = row[h.key];
            }
          
            if (typeof value === "string") {
              value = value.replace(/"/g, '""'); 
              value = `"${value}"`;
            }
          
            return value;
          }).join(",");
          csv += line + "\n";
        });
      
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
      
        const a = document.createElement("a");
        a.href = url;
        a.download = `products_${Date.now()}.csv`;
        a.click();
      
        URL.revokeObjectURL(url);
      },
      edit(n){
        const editVal = [];

        for(let i = 0 ; i <= this.tickets.length ; i++){
          if (n == this.tickets[i].id){
            this.valueId = this.tickets[i].id;
            this.valueTitle = this.tickets[i].title;
            this.valuePrice = this.tickets[i].price;
            this.valueDescription = this.tickets[i].description;
            this.valueLaunch = this.tickets[i].launch;
            this.valueSafetyStock = this.tickets[i].safety_stock;
          }
        }
        
        
        

      },
      async updatetickets(n){

        const id = n;
        
        if (
          !this.valueTitle.trim() ||
          !this.valueDescription.trim() ||
          !this.valuePrice.trim() ||
          !this.valueSafetyStock.trim()
        ) {
          alert("請輸入所有欄位內容。");
          return;
        }

        const price = Number(this.valuePrice);

        if (isNaN(price) || price <= 0 || !Number.isInteger(price)) {
          alert("價格格式錯誤，請輸入正整數。");
          return;
        }

        const SafetyStock = Number(this.valueSafetyStock);

        if (isNaN(SafetyStock) || SafetyStock <= 0 || !Number.isInteger(SafetyStock)) {
          alert("價格格式錯誤，請輸入正整數。");
          return;
        }


        console.log(id);
      }
    },
    computed: {
      
    }
    
  })
  