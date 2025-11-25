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
      valueSafetyStock: 0,

      catalog: [],


      updateA_title: "", 
      updateA_description: "" , 
      updateA_price: 0 ,
      updateA_safety_stock: 0,
      updateA_launch: false,

      filterbtn: "",
      filter_sort: true,

      searchTitle: "",
      searchId: "",
      searchCata: ""
      

    },
    async mounted() {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .order('id', { ascending: true })
    
            if (error) throw error
            this.tickets = data

            this.cata()

            for(let i = 0 ; i <= data.length ; i++){
              if( data[i].inventory > 0 && data[i].inventory >= data[i].safety_stock ){
                this.inventory_count[0].count ++;
                this.tickets[i].status = "可供銷售";
              }
              else if( data[i].inventory > 0 && data[i].inventory < data[i].safety_stock ){
                this.inventory_count[1].count ++;
                this.tickets[i].status = "需補貨";
              }
              else{
                this.inventory_count[2].count ++;
                this.tickets[i].status = "缺貨中";
              }
            }

    
        } catch (err) {
            console.error('Supabase select failed:', err)
        }
    },
    methods: {

      toTwTime (utcString) {
        const date = new Date(utcString)
        return date.toLocaleString('sv-SE', {
          timeZone: 'Asia/Taipei',
          hour12: false
        })
      },
      
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
              value = getStatus(row); 
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
          !this.valueDescription.trim()
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
        
        this.updateA_title = this.valueTitle;
        this.updateA_description = this.valueDescription;
        this.updateA_price = this.valuePrice;
        this.updateA_safety_stock = this.valueSafetyStock;
        this.updateA_launch = this.valueLaunch;


        /*alert(this.updateA_launch);*/
        const now = new Date().toISOString()
        
        const { error: updateError } = await supabase
        .from('tickets')
        .update({ title: this.updateA_title ,  description: this.updateA_description , price: this.updateA_price , safety_stock:this.updateA_safety_stock , launch: this.updateA_launch , latest_time: now})
        .eq('id', id);

        alert("修改成功！");
        window.location.reload();

      },
      async searchTickets() {
        
        const keyword     = (this.searchTitle || '').trim()
        const keywordId   = (this.searchId || '').trim()
        const keywordCata = (this.searchCata || '').trim()
      
        try {
          let query = supabase
            .from('tickets')
            .select('*')
            .order('id', { ascending: true })
      
          
          if (keyword) {
            query = query.ilike('title', `%${keyword}%`)
          }
      
          
          if (keywordId) {
            query = query.ilike('product_id', `%${keywordId}%`)
          }
      
        
          if (keywordCata) {
            query = query.eq('category', keywordCata)
          }
      
        
          const { data, error } = await query
      
          if (error) {
            console.error('searchTickets error:', error)
            return
          }
      
       
          const rows = data || []
          this.tickets = rows.map(row => {
            let statusText = ''
      
            if (row.inventory > 0 && row.inventory >= row.safety_stock) {
              statusText = '可供銷售'
            } else if (row.inventory > 0 && row.inventory < row.safety_stock) {
              statusText = '需補貨'
            } else {
              statusText = '缺貨中'
            }
      
            return { ...row, status: statusText }
          })
        } catch (err) {
          console.error('searchTickets exception:', err)
        }
      },
    
      
      async filter(n) {
        this.filterbtn = n
      
        const keywordTitle = (this.searchTitle || '').trim()  
        const keywordId    = (this.searchId || '').trim()    
        const keywordCata  = (this.searchCata || '').trim()  
      
    
        if (n === 'status') {
          const asc = this.filter_sort
          this.filter_sort = !this.filter_sort  
      
    
          let sorted = [...this.tickets].sort((a, b) => {
            const sa = a.status || ''
            const sb = b.status || ''
            return asc
              ? sa.localeCompare(sb)
              : sb.localeCompare(sa)
          })
      
       
          if (keywordTitle) {
            sorted = sorted.filter(ticket =>
              ticket.title && ticket.title.includes(keywordTitle)
            )
          }
      
          this.tickets = sorted
          return
        }
      
        
        try {
          let query = supabase
            .from('tickets')
            .select('*')
      
       
          if (keywordTitle) {
            query = query.ilike('title', `%${keywordTitle}%`)
          }
      
       
          if (keywordId) {
            query = query.ilike('product_id', `%${keywordId}%`)
          }
      
         
          if (keywordCata) {
            query = query.eq('category', keywordCata)
          }
      
         
          query = query.order(n, { ascending: this.filter_sort })
      
          const { data, error } = await query
      
          if (error) throw error
      
          
          this.filter_sort = !this.filter_sort
      
          const rows = data || []
      
          
          for (let i = 0; i < rows.length; i++) {
            const item = rows[i]
            if (item.inventory > 0 && item.inventory >= item.safety_stock) {
              item.status = '可供銷售'
            } else if (item.inventory > 0 && item.inventory < item.safety_stock) {
              item.status = '需補貨'
            } else {
              item.status = '缺貨中'
            }
          }
      
          this.tickets = rows
        } catch (err) {
          console.error('Supabase select failed:', err)
        }
      },
      

      async cata () {
        const { data, error } = await supabase
          .from('tickets')
          .select('category')
          .order('id', { ascending: true })
    
        if (error) {
          console.error(error)
          return
        }
    
        const cata = data || []   
        this.catalog = [...new Set(cata.map(item => item.category))]
      }
    },
    computed: {
      
    }
    
  })
  