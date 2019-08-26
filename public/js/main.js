

$(document).ready(() => {
    //delete a thread 
    $(".delete_thread").on("click", (e) => {
        const thread_id = $(e.target).attr("thread_id");
        const user_id = $(e.target).attr("user_id");

        $.ajax({
            type: "DELETE",
            url: "/user/message/delete/" + thread_id,
            success: function (response) {
                window.location.href = "/user/messages/";
            },
            error: function (error) {
                alert("You are going to delete a thread.");
            }
        })
    })

    //shows the filename when upload the file
    $(document).on('change',".custom-file-input",(e)=>{
        $(".custom-file-input").next('.custom-file-label').html(e.target.files[0].name)
    })

  

    $('.delete-book').on("click", (e) => {
        // console.log(e.target.getAttribute("id"));
        const id = $(e.target).attr("id");
        $.ajax({
            type: "DELETE",
            url: "/book/" + id,
            success: function (res) {
                alert("Delete Book");
                window.location.href = "/book/add"
            },
            error: function (err) {
                console.log(err)
            }

        })

    })
    //search a book
    $('#search').on("click", () => {
        const value = $('#searchquery').val();
        $.ajax({
            type: "GET",
            url: "/book/search?bookname=" + value,
            success: function (res) {
                window.location.href = "/book/search?bookname=" + value;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(textStatus, errorThrown)
            }
        })
    })
    // search a user
    $('.search').on("click", () => {
        const value = $('#searchuser').val();
        console.log(value)
        $.ajax({
            type: "GET",
            url: "/user/search?keyword=" + value,
            success: function (res) {
                //console.log(res)
                window.location.href = res
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(textStatus, errorThrown)
            }
        })
    })



    //submit a request
    $(".submit_request").on("click", (e) => {
        e.preventDefault();
        const user_id = $(".submit_request").attr("userid");
        const username = $('.submit_request').attr("user");
        const pick = $("#pick_book option:selected").val();
        const take = $("#take_book option:selected").val();
        const note = $("#note").serialize();
        const url = "/request/newrequest/" + user_id + "?pick=" + pick + '&take=' + take + "&user=" + username;
        $.ajax({
            type: "POST",
            url: url,
            success: function (res) {
                window.location.href = "/request/newrequest/" + user_id;
            },
            data: note,
            error: function (error) {
                console.log(error)
                window.location.href = "/request/newrequest/" + user_id;
            }


        })
    })

    // cancel a request
    $(".cancel").on("click", () => {
        const request_id = $(".cancel").attr("request_id");
        console.log(request_id)
        $.ajax({
            type: "delete",
            url: "/request/delete/" + request_id,
            success: function (res) {
                window.location.href = "/request/myoutgoing"
            },
            error: function (err) {
                console.log(err)
            }
        })
    })

   

})
//make sure use the regualr version of Jquery, not the slim verion, because Ajax is not included in the slim build of jquery.
