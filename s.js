let editing=0;
let visualize_closed=false;
let tree = [{parent_id:0,now:0,content:"",closed:false}];
let edited=false;

function get_tree_item(task){
    return tree[Number(task.id.slice(1))];
}

//ページから離れるときに警告を出す。
window.addEventListener("beforeunload", (event) => {
    if(edited===false){return;}
    event.preventDefault();
    event.returnValue = "";
});

//新しい項目ボタンが押された時のイベントリスナー
document.querySelector("#new_task").addEventListener("click", () => {
    event.stopPropagation();
    add_task(document.querySelector("#_0"));
});

//再表示ボタンが押された時のイベントリスナー
document.querySelector("#reprint").addEventListener("click", () => {
    event.stopPropagation();
    parse_tree();
});

//ファイル取込ボタンが押された時のイベントリスナー
document.getElementById('load').addEventListener('click', () => {
    if(edited===true){
        let ret=confirm('編集内容を上書きしますか？');
        if(ret===false){return;}
    }
    document.getElementById('fileInput').click();
});

//ファイルを選択ボタン(非表示)が押された時のイベントリスナー
document.getElementById('fileInput').addEventListener('change', function(event) {
    
    const file = event.target.files[0]; // 選択されたファイルを取得
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            //console.log(e.target.result); // ファイル内容をコンソールに表示
            
            //ファイルからJSONを読み出す。
            try {
                tree=JSON.parse(e.target.result);
                //document.querySelector("input").remove();
            } catch (error) {
                console.error("JSON parsing failed:", error.message);
                return;
            }

            for(let i=0;i<tree.length;++i){
                //型変換
                tree[i].now=new Date(tree[i].now);
            }

            parse_tree();
            edited=false;
        };
        reader.readAsText(file); // テキストとしてファイルを読み込む
    }
});

//ファイル出力ボタンが押された時のイベントリスナー
document.querySelector("#download").addEventListener("click", () => {
    let treestring = JSON.stringify(tree);
    let blob = new Blob([treestring],{type:"text/plan"});
    let link = document.createElement('a'); 
    link.href = URL.createObjectURL(blob);
    const now = new Date();
    link.download = "tree_"+String(now.getTime())+".json";
    link.click();
    link.remove();
    edited=false;
});

//チェックボックスをクリックしたときのイベントリスナー
let vc=document.querySelector("#visualize_closed");
vc.addEventListener('click', () => {
    if(vc.checked){visualize_closed=true;}
    else{visualize_closed=false;}
    parse_tree();
});


//closedに色を付ける
function colorize_task(task){
    let a=get_tree_item(task);
    if(a.closed===true){
        task.querySelector("span").style.backgroundColor='#c0c0c0';
    }else{
        task.querySelector("span").style.backgroundColor='';
    }
}

//オブジェクトを木に変換する。
function parse_tree(){
    //配列treeが空
    if(tree.length===1){return;}
    let root = document.querySelector("#_0")
    if (root.childElementCount !== 0){
        root.removeChild(root.querySelector("ul"));
    }
    root = root.appendChild(document.createElement("ul"));
    //配列treeから順にtaskを読み出す。
    for(let i=tree.length-1;i>0;--i){
        //いま読みだしたtaskを仮にroot直下に置く。
        let task=document.createElement("li")
        root.appendChild(task);
        task.id="_"+String(i);
        commit_task(task, tree[i].now, tree[i].content);
        let len=root.children.length-1;
        for(let j=0;j<len;++j){
            //taskの子が見つかったらそいつをtaskの下に移植する。
            if(get_tree_item(root.children[j]).parent_id===i){
                //最初の子だったらそいつの位置にtask自身を移植する。
                if(task.querySelector("ul")=== null){
                    task=root.removeChild(task);
                    root.children[j].after(task);
                    task.appendChild(document.createElement("ul"));
                    ++len;
                }
                task.querySelector("ul").appendChild(root.removeChild(root.children[j]));
                --len;
            }
        }
        if(visualize_closed === false && tree[i].closed === true && task.querySelector("ul")=== null){root.removeChild(task);}
        else{colorize_task(task);}
    }
}

function commit_task(task, now, content){
    let span = task.appendChild(document.createElement("span"));

    span.textContent=now.toLocaleDateString()+" "+content;
    //このタスクがクリックされた時のイベントリスナー
    span.addEventListener("click", (event) => {
        event.stopPropagation();
        add_task(task);
    });
}

function create_form(parent, task, parent_id){
    //テキストボックスを設置
    let task_textarea=document.createElement("textarea");
    task.appendChild(task_textarea);
    task_textarea.focus();
    
    //ボタンを入れるdivを設置
    let v=document.createElement("div");
    task.appendChild(v);

    //OKボタンを設置
    let v_ok=document.createElement("button");
    v.appendChild(v_ok);
    v_ok.textContent="OK";

    //OKが押された時のイベントリスナー
    v_ok.addEventListener("click", (event) => {
        event.stopPropagation();
        //テキストボックスの読み取り
        let content = task.querySelector("textarea").value
        
        //テキストボックスの削除
        task.querySelector("textarea").remove();

        //テキストボックスが空でなければ、新しいタスクを作る。
        if(content !== ""){
            const now = new Date();
            commit_task(task, now, content);
            tree.push({parent_id:parent_id,now:now,content:content,closed:false})
            v.remove();
            edited=true;
        }
        else{
            task.remove();
        }
        //編集モード終了
        editing=0;

    });

    //CANCELボタンを設置
    let v_cancel=document.createElement("button");
    v.appendChild(v_cancel);
    v_cancel.textContent="CANCEL";

    //CANCELが押された時のイベントリスナー
    v_cancel.addEventListener("click", (event) => {
        event.stopPropagation();
        task.remove();
        //編集モード終了
        editing=0;
    });
    
    if(parent_id!==0){
        //closeボタンを設置
        let v_close=document.createElement("button");
        v.appendChild(v_close);
        if(get_tree_item(parent).closed===false){
            v_close.textContent="COLSE";
        }else{
            v_close.textContent="REOPEN";
        }
        //closeが押された時のイベントリスナー
        v_close.addEventListener("click", (event) => {
            event.stopPropagation();
            if(get_tree_item(parent).closed===false){
                get_tree_item(parent).closed=true;
            }else{
                get_tree_item(parent).closed=false;
            }
            task.remove();
            colorize_task(parent);
            //編集モード終了
            editing=0;
            edited=true;
        });
    }
}

function add_task(parent){
    //すでに編集モードだったら新しいタスクは追加しない。
    if(editing)return;

    //編集モードに遷移
    editing = 1;

    let child=new_child(parent,tree.length)
    //フォームを作る。
    create_form(parent,child,Number(parent.id.slice(1)));
    

}

function new_child(parent, id){
    //親タスクにul要素がなければ作る。
    let parent_ul;
    if (parent.querySelector("ul")=== null){
        parent_ul=document.createElement("ul");
        parent.appendChild(parent_ul);
    }else{
        parent_ul=parent.querySelector("ul");
    }

    //本タスクのli要素を作る。
    let child=document.createElement("li");
    parent_ul.prepend(child);
    child.id="_"+String(id);
    add_task(child);
    return child;
}